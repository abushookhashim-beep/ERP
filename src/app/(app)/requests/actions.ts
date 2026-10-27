"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma, RequestType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/lib/form";
import { optional } from "@/lib/form";
import { SUBTYPES, buildSteps, canActOnStep, inclusiveDays } from "@/lib/requests";
import { checkFile, storeFile, uploadedFile } from "@/lib/files";
import { can } from "@/lib/permissions";
import { getAnnualBalance, getLeavePolicy, getSickDaysInYear } from "@/lib/leave";
import { t } from "@/i18n";

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t.common.required).transform((s) => new Date(s));

async function createRequest(
  type: RequestType,
  subject: { id: string; managerId: string | null },
  createdById: string,
  data: Omit<Prisma.RequestUncheckedCreateInput, "type" | "subjectId" | "createdById" | "steps">,
): Promise<never> {
  const steps = await buildSteps(type, subject);
  const allSkipped = steps.every((s) => s.status === "SKIPPED");
  const request = await db.request.create({
    data: {
      ...data,
      type,
      subjectId: subject.id,
      createdById,
      ...(allSkipped && { status: "APPROVED", completedAt: new Date() }),
      steps: { createMany: { data: steps } },
    },
  });
  revalidatePath("/requests");
  revalidatePath("/approvals");
  redirect(`/requests/${request.id}`);
}

const leaveSchema = z.object({
  subtype: z.enum(SUBTYPES.LEAVE),
  startDate: dateField,
  endDate: dateField,
});

export async function createLeave(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = leaveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { subtype, startDate, endDate } = parsed.data;
  if (endDate < startDate) return { error: t.requests.invalidDates };
  const days = inclusiveDays(startDate, endDate);
  const policy = await getLeavePolicy();

  if (subtype === "ANNUAL") {
    const profile = await db.employeeProfile.findUnique({ where: { userId: user.id } });
    const balance = await getAnnualBalance(user.id, profile, policy);
    // بدون تاريخ مباشرة لا نعرف الرصيد، فنترك القرار للمعتمدين
    if (balance && days > balance.available) return { error: t.requests.insufficientBalance(Math.max(0, balance.available)) };
  }
  if (subtype === "MARRIAGE" && days > policy.marriageDays) return { error: t.requests.exceedsLimit(policy.marriageDays) };
  if (subtype === "BEREAVEMENT" && days > policy.bereavementDays) return { error: t.requests.exceedsLimit(policy.bereavementDays) };

  const file = uploadedFile(formData.get("attachment"));
  if (subtype === "SICK") {
    if (!file) return { error: t.requests.attachmentRequired };
    const used = await getSickDaysInYear(user.id, startDate.getUTCFullYear());
    if (used + days > policy.sickDaysPerYear) return { error: t.requests.sickLimit(Math.max(0, policy.sickDaysPerYear - used)) };
  }
  if (file) {
    const fileError = checkFile(file);
    if (fileError) return { error: t.hr.files[fileError] };
  }

  return createRequest("LEAVE", user, user.id, {
    subtype,
    startDate,
    endDate,
    days,
    notes: optional(formData.get("notes")),
    ...(file && { attachmentId: await storeFile(file, user.id) }),
  });
}

const letterSchema = z.object({
  subtype: z.enum(SUBTYPES.LETTER),
  addressedTo: z.string().trim().min(1, t.common.required),
});

export async function createLetter(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = letterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { subtype, addressedTo } = parsed.data;

  const details: Record<string, string> = { addressedTo };
  if (subtype === "SALARY_TRANSFER") {
    const bankName = optional(formData.get("bankName"));
    const iban = optional(formData.get("iban"));
    if (!bankName || !iban) return { error: t.common.required };
    Object.assign(details, { bankName, iban: iban.replace(/\s+/g, "").toUpperCase() });
  }

  return createRequest("LETTER", user, user.id, { subtype, details, notes: optional(formData.get("notes")) });
}

const pledgeSchema = z.object({
  subtype: z.enum(SUBTYPES.PLEDGE),
  subjectId: z.string().min(1, t.common.required),
  pledgeTitle: z.string().trim().min(1, t.common.required),
  pledgeBody: z.string().trim().min(1, t.common.required),
});

export async function createPledge(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!can(user, "requests.sendPledge")) return { error: t.requests.notAllowed };
  const parsed = pledgeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { subtype, subjectId, pledgeTitle, pledgeBody } = parsed.data;

  const subject = await db.user.findUnique({ where: { id: subjectId, active: true } });
  if (!subject) return { error: t.common.required };

  const items = String(formData.get("items") ?? "")
    .split("\n").map((l) => l.trim()).filter(Boolean);
  if (subtype === "CUSTODY" && items.length === 0) return { error: t.common.required };

  return createRequest("PLEDGE", subject, user.id, {
    subtype,
    details: { pledgeTitle, pledgeBody, ...(items.length && { items }) },
  });
}

export async function actOnRequest(
  requestId: string,
  decision: "APPROVED" | "REJECTED",
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const comment = optional(formData.get("comment"));
  if (decision === "REJECTED" && !comment) return { error: t.requests.rejectReason };

  const request = await db.request.findUnique({
    where: { id: requestId },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  if (!request || request.status !== "PENDING") return { error: t.requests.notAllowed };
  const step = request.steps.find((s) => s.status === "PENDING");
  if (!step || !canActOnStep(step, user, request.subjectId)) return { error: t.requests.notAllowed };

  const next = request.steps.find((s) => s.order > step.order && s.status === "WAITING");
  const finished = decision === "REJECTED" || !next;

  await db.$transaction(async (tx) => {
    // الشرط على الحالة يمنع اعتماد نفس الخطوة مرتين لو ضغط شخصان في نفس اللحظة
    const { count } = await tx.approvalStep.updateMany({
      where: { id: step.id, status: "PENDING" },
      data: { status: decision, comment, actedById: user.id, actedAt: new Date() },
    });
    if (count === 0) throw new Error("Step already handled");

    if (finished) {
      await tx.request.update({ where: { id: request.id }, data: { status: decision, completedAt: new Date() } });
    } else {
      await tx.approvalStep.update({ where: { id: next.id }, data: { status: "PENDING" } });
    }
  });

  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/requests");
  revalidatePath("/approvals");
  revalidatePath("/");
  return { ok: true };
}

export async function cancelRequest(requestId: string) {
  const user = await requireUser();
  await db.request.updateMany({
    where: { id: requestId, createdById: user.id, status: "PENDING" },
    data: { status: "CANCELLED", completedAt: new Date() },
  });
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/requests");
  revalidatePath("/approvals");
}
