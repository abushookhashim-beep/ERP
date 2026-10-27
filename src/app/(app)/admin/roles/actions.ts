"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { isUniqueViolation, optional, type FormState } from "@/lib/form";
import { ADMIN_LOCKED, ADMIN_ROLE_ID, isPermission } from "@/lib/permissions";
import { t } from "@/i18n";

/** ينشئ دوراً جديداً (id فارغ) أو يعدّل دوراً قائماً. */
export async function saveRole(id: string | null, _: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("admin.roles");
  const name = optional(formData.get("name"));
  if (!name) return { error: t.common.required };

  const permissions = new Set(formData.getAll("permissions").map(String).filter(isPermission));
  if (id === ADMIN_ROLE_ID) for (const p of ADMIN_LOCKED) permissions.add(p);
  const data = { name, description: optional(formData.get("description")), permissions: [...permissions] };

  try {
    if (id) await db.role.update({ where: { id }, data });
    else await db.role.create({ data });
  } catch (e) {
    if (isUniqueViolation(e)) return { error: t.roles.duplicate };
    throw e;
  }
  revalidatePath("/", "layout");
  redirect("/admin/roles");
}

export async function deleteRole(id: string): Promise<FormState> {
  await requirePermission("admin.roles");
  const role = await db.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
  if (!role || role.system || role._count.users > 0) return { error: t.roles.cannotDelete };
  await db.role.delete({ where: { id } });
  revalidatePath("/admin/roles");
  redirect("/admin/roles");
}
