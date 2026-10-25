"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/lib/form";
import { t } from "@/i18n";

const STRONG = /^(?=.*\p{L})(?=.*\d).{8,}$/u;

export async function changePassword(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: t.changePassword.wrongCurrent };
  if (!STRONG.test(next)) return { error: t.changePassword.weak };
  if (next !== confirm) return { error: t.changePassword.mismatch };
  if (next === current) return { error: t.changePassword.sameAsOld };

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(next, 10), mustChangePassword: false },
  });
  redirect("/?passwordChanged=1");
}
