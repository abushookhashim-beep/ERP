"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
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
