"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CircularAudience, CircularCategory, type Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canPublish, getCircularForUser, getPublishScope, hijriYear } from "@/lib/circulars";
import { descendantIds } from "@/lib/departments";
import { checkFile, storeFile, uploadedFile } from "@/lib/files";
import { isUniqueViolation, optional, type FormState } from "@/lib/form";
import { dateInput } from "@/lib/hr";
import { t } from "@/i18n";

const c = t.circulars;

const revalidateCirculars = (id?: string) => {
  revalidatePath("/circulars");
  revalidatePath("/", "layout");
  if (id) revalidatePath(`/circulars/${id}`);
};

export async function publishCircular(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const scope = await getPublishScope(user);
  if (!canPublish(scope)) return { error: c.notAllowed };

  const title = optional(formData.get("title"));
  const body = optional(formData.get("body"));
  const category = formData.get("category") as CircularCategory;
  const audience = formData.get("audience") as CircularAudience;
  if (!title || !body || !(category in CircularCategory) || !(audience in CircularAudience)) return { error: t.common.required };
  // مدير الإدارة يصدر لإدارته فقط
  if (!scope.full && audience !== "DEPARTMENTS") return { error: c.scopeLimited };

  const departmentIds = audience === "DEPARTMENTS" ? [...new Set(formData.getAll("departments").map(String))] : [];
  const peopleIds = audience === "PEOPLE" ? [...new Set(formData.getAll("people").map(String))] : [];
  if (audience === "DEPARTMENTS" && departmentIds.length === 0) return { error: c.selectTarget };
  if (audience === "PEOPLE" && peopleIds.length === 0) return { error: c.selectTarget };
  if (!scope.full && departmentIds.some((id) => !scope.departmentIds.includes(id))) return { error: c.scopeLimited };

  let recipientWhere: Prisma.UserWhereInput = { active: true };
  if (audience === "DEPARTMENTS") {
    const all = await db.department.findMany({ select: { id: true, parentId: true, sortOrder: true, name: true } });
    const ids = new Set<string>();
    for (const id of departmentIds) for (const d of descendantIds(all, id)) ids.add(d);
    recipientWhere = { active: true, departmentId: { in: [...ids] } };
  } else if (audience === "PEOPLE") {
    recipientWhere = { active: true, id: { in: peopleIds } };
  }
  const recipients = await db.user.findMany({ where: { ...recipientWhere, NOT: { id: user.id } }, select: { id: true } });
  if (recipients.length === 0) return { error: c.noRecipients };

  const files = formData.getAll("attachments").map(uploadedFile).filter((f): f is File => f !== null);
  for (const file of files) {
    const fileError = checkFile(file);
    if (fileError) return { error: `${file.name}: ${t.hr.files[fileError]}` };
  }
  const fileIds = await Promise.all(files.map((f) => storeFile(f, user.id)));

  const year = hijriYear();
  let circularId: string | undefined;
  // نعيد المحاولة إذا أخذ تعميم آخر نفس التسلسل في نفس اللحظة
  for (let attempt = 0; !circularId; attempt++) {
    const last = await db.circular.aggregate({ where: { year }, _max: { seq: true } });
    try {
      const circular = await db.circular.create({
        data: {
          year,
          seq: (last._max.seq ?? 0) + 1,
          title,
          body,
          category,
          audience,
          important: formData.get("important") === "on",
          expiresAt: dateInput(formData.get("expiresAt")),
          issuerId: user.id,
          departments: { createMany: { data: departmentIds.map((departmentId) => ({ departmentId })) } },
          recipients: { createMany: { data: recipients.map((r) => ({ userId: r.id })) } },
          attachments: { createMany: { data: fileIds.map((fileId) => ({ fileId })) } },
        },
      });
      circularId = circular.id;
    } catch (e) {
      if (!isUniqueViolation(e) || attempt >= 3) throw e;
    }
  }
  revalidateCirculars();
  redirect(`/circulars/${circularId}`);
}

export async function acknowledgeCircular(circularId: string) {
  const user = await requireUser();
  const now = new Date();
  await db.circularRecipient.updateMany({
    where: { circularId, userId: user.id, acknowledgedAt: null },
    data: { acknowledgedAt: now },
  });
  revalidateCirculars(circularId);
}

export async function remindCircular(circularId: string): Promise<{ count?: number; error?: string }> {
  const user = await requireUser();
  const view = await getCircularForUser(circularId, user);
  if (!view?.canTrack) return { error: t.requests.notAllowed };
  const pending = view.circular.important ? { acknowledgedAt: null } : { readAt: null };
  // نعيد الحالة إلى غير مقروء ليظهر التعميم في تنبيهات الموظف من جديد
  const { count } = await db.circularRecipient.updateMany({
    where: { circularId, ...pending },
    data: { remindedAt: new Date(), readAt: null },
  });
  revalidateCirculars(circularId);
  return { count };
}
