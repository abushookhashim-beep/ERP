"use server";

import { revalidatePath } from "next/cache";
import { ContractType, DocumentType, Gender, MaritalStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { checkFile, storeFile, uploadedFile } from "@/lib/files";
import { optional, type FormState } from "@/lib/form";
import { dateInput } from "@/lib/hr";
import { DEFAULT_LEAVE_POLICY, LEAVE_POLICY_SETTING, type LeavePolicy } from "@/lib/leave";
import { t } from "@/i18n";

const enumValue = <T extends Record<string, string>>(e: T, v: FormDataEntryValue | null) =>
  typeof v === "string" && v in e ? (v as T[keyof T]) : null;

const money = (v: FormDataEntryValue | null) => {
  const s = optional(v)?.replace(/,/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? s : undefined;
};

export async function saveProfile(userId: string, _: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("hr.edit");
  const f = (k: string) => formData.get(k);

  const amounts = {
    basicSalary: money(f("basicSalary")),
    housingAllowance: money(f("housingAllowance")),
    transportAllowance: money(f("transportAllowance")),
    otherAllowance: money(f("otherAllowance")),
    openingLeaveBalance: money(f("openingLeaveBalance")),
  };
  if (Object.values(amounts).includes(undefined)) return { error: t.hr.policy.invalid };

  const data = {
    nationality: optional(f("nationality")),
    birthDate: dateInput(f("birthDate")),
    gender: enumValue(Gender, f("gender")),
    maritalStatus: enumValue(MaritalStatus, f("maritalStatus")),
    emergencyName: optional(f("emergencyName")),
    emergencyPhone: optional(f("emergencyPhone")),
    hireDate: dateInput(f("hireDate")),
    contractType: enumValue(ContractType, f("contractType")),
    contractEnd: dateInput(f("contractEnd")),
    probationEnd: dateInput(f("probationEnd")),
    workLocation: optional(f("workLocation")),
    bankName: optional(f("bankName")),
    iban: optional(f("iban"))?.replace(/\s+/g, "").toUpperCase() ?? null,
    gosiNumber: optional(f("gosiNumber")),
    leaveBalanceAsOf: dateInput(f("leaveBalanceAsOf")),
    ...(amounts as Record<keyof typeof amounts, string | null>),
  };

  await db.employeeProfile.upsert({ where: { userId }, update: data, create: { userId, ...data } });
  revalidatePath(`/hr/employees/${userId}`);
  revalidatePath("/hr");
  return { ok: true };
}

export async function addDocument(userId: string, _: FormState, formData: FormData): Promise<FormState> {
  const actor = await requirePermission("hr.edit");
  const type = enumValue(DocumentType, formData.get("type"));
  if (!type) return { error: t.common.required };

  const file = uploadedFile(formData.get("file"));
  if (file) {
    const fileError = checkFile(file);
    if (fileError) return { error: t.hr.files[fileError] };
  }

  await db.employeeDocument.create({
    data: {
      userId,
      type,
      number: optional(formData.get("number")),
      issueDate: dateInput(formData.get("issueDate")),
      expiryDate: dateInput(formData.get("expiryDate")),
      notes: optional(formData.get("notes")),
      ...(file && { fileId: await storeFile(file, actor.id) }),
    },
  });
  revalidatePath(`/hr/employees/${userId}`);
  revalidatePath("/hr");
  return { ok: true };
}

export async function deleteDocument(documentId: string) {
  await requirePermission("hr.edit");
  const doc = await db.employeeDocument.delete({ where: { id: documentId } });
  if (doc.fileId) await db.storedFile.delete({ where: { id: doc.fileId } });
  revalidatePath(`/hr/employees/${doc.userId}`);
  revalidatePath("/hr");
}

export async function saveLeavePolicy(_: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("hr.policy");
  const policy = {} as LeavePolicy;
  for (const key of Object.keys(DEFAULT_LEAVE_POLICY) as (keyof LeavePolicy)[]) {
    const n = Number(formData.get(key));
    if (!Number.isInteger(n) || n < 0 || n > 365) return { error: t.hr.policy.invalid };
    policy[key] = n;
  }
  const value = JSON.stringify(policy);
  await db.setting.upsert({ where: { key: LEAVE_POLICY_SETTING }, update: { value }, create: { key: LEAVE_POLICY_SETTING, value } });
  revalidatePath("/hr");
  return { ok: true };
}
