"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { type FormState, isForeignKeyViolation, isUniqueViolation, optional } from "@/lib/form";
import { t } from "@/i18n";

const schema = z.object({
  employeeNo: z.string().trim().min(1, t.common.required),
  name: z.string().trim().min(1, t.common.required),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, t.users.passwordShort),
  role: z.nativeEnum(Role),
});

export async function createUser(_: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { password, ...data } = parsed.data;

  try {
    await db.user.create({
      data: {
        ...data,
        passwordHash: await bcrypt.hash(password, 10),
        jobTitle: optional(formData.get("jobTitle")),
        departmentId: optional(formData.get("departmentId")),
        managerId: optional(formData.get("managerId")),
      },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { error: t.users.duplicate };
    throw e;
  }
  revalidatePath("/admin/users");
  return { ok: true };
}

const updateSchema = schema.omit({ password: true }).extend({
  password: z.union([z.literal(""), z.string().min(8, t.users.passwordShort)]),
});

export async function updateUser(id: string, _: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireRole("ADMIN");
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { password, ...data } = parsed.data;
  const active = formData.get("active") === "on";
  if (id === admin.id && (data.role !== "ADMIN" || !active)) return { error: t.users.cannotDemoteSelf };

  const managerId = optional(formData.get("managerId"));
  if (managerId && (await reportsTo(managerId, id))) return { error: t.users.invalidManager };

  try {
    await db.user.update({
      where: { id },
      data: {
        ...data,
        active,
        jobTitle: optional(formData.get("jobTitle")),
        phone: optional(formData.get("phone")),
        departmentId: optional(formData.get("departmentId")),
        managerId,
        ...(password && { passwordHash: await bcrypt.hash(password, 10), mustChangePassword: true }),
      },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { error: t.users.duplicate };
    throw e;
  }
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

/** هل userId هو نفسه targetId أو يتبع له في سلسلة الإدارة؟ */
async function reportsTo(userId: string, targetId: string) {
  const seen = new Set<string>();
  let current: string | null = userId;
  while (current && !seen.has(current)) {
    if (current === targetId) return true;
    seen.add(current);
    const next: { managerId: string | null } | null = await db.user.findUnique({
      where: { id: current },
      select: { managerId: true },
    });
    current = next?.managerId ?? null;
  }
  return false;
}

export async function toggleUserActive(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id"));
  if (id === admin.id) return; // لا يمكن للمدير إيقاف حسابه
  const user = await db.user.findUniqueOrThrow({ where: { id } });
  await db.user.update({ where: { id }, data: { active: !user.active } });
  revalidatePath("/admin/users");
}

export async function deleteUser(id: string): Promise<FormState> {
  const admin = await requireRole("ADMIN");
  if (id === admin.id) return; // لا يمكن للمدير حذف حسابه
  try {
    // من كان هذا المستخدم مديره المباشر أو مدير إدارته يصبح بلا مدير
    await db.user.delete({ where: { id } });
  } catch (e) {
    if (isForeignKeyViolation(e)) return { error: t.users.hasHistory };
    throw e;
  }
  revalidatePath("/admin/users");
  return { ok: true };
}
