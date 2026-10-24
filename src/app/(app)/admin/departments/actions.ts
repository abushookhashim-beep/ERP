"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { type FormState, isUniqueViolation, optional } from "@/lib/form";
import { t } from "@/i18n";

export async function createDepartment(_: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN");
  const name = optional(formData.get("name"));
  if (!name) return { error: t.common.required };

  try {
    await db.department.create({
      data: {
        name,
        parentId: optional(formData.get("parentId")),
        headId: optional(formData.get("headId")),
      },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { error: t.departments.duplicate };
    throw e;
  }
  revalidatePath("/admin/departments");
  return { ok: true };
}
