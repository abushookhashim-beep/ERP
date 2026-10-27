"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { descendantIds } from "@/lib/departments";
import { type FormState, isUniqueViolation, optional } from "@/lib/form";
import { t } from "@/i18n";

export async function createDepartment(_: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("admin.departments");
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

export async function updateDepartment(id: string, _: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("admin.departments");
  const name = optional(formData.get("name"));
  if (!name) return { error: t.common.required };
  const parentId = optional(formData.get("parentId"));

  if (parentId) {
    const all = await db.department.findMany({ select: { id: true, parentId: true, sortOrder: true, name: true } });
    if (descendantIds(all, id).has(parentId)) return { error: t.departments.invalidParent };
  }

  try {
    await db.department.update({
      where: { id },
      data: { name, parentId, headId: optional(formData.get("headId")) },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { error: t.departments.duplicate };
    throw e;
  }
  revalidatePath("/admin/departments");
  redirect("/admin/departments");
}

export async function deleteDepartment(id: string): Promise<FormState> {
  await requirePermission("admin.departments");
  const counts = await db.department.findUniqueOrThrow({
    where: { id },
    select: { _count: { select: { members: true, children: true } } },
  });
  if (counts._count.members > 0 || counts._count.children > 0) return { error: t.departments.notEmpty };

  await db.department.delete({ where: { id } });
  revalidatePath("/admin/departments");
  return { ok: true };
}
