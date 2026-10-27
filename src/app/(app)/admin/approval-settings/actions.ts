"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { optional, type FormState } from "@/lib/form";
import { CEO_SETTING } from "@/lib/requests";

export async function saveApprovalSettings(_: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("admin.approvalSettings");
  const ceoId = optional(formData.get("ceoId"));
  if (ceoId) {
    await db.setting.upsert({ where: { key: CEO_SETTING }, update: { value: ceoId }, create: { key: CEO_SETTING, value: ceoId } });
  } else {
    await db.setting.deleteMany({ where: { key: CEO_SETTING } });
  }
  revalidatePath("/admin/approval-settings");
  return { ok: true };
}
