import type { Role } from "@prisma/client";

/** من يرى ملفات الموظفين. */
export const HR_VIEW_ROLES: Role[] = ["ADMIN", "HR", "EXECUTIVE"];
/** من يعدّل ملفات الموظفين ومستنداتهم. */
export const HR_EDIT_ROLES: Role[] = ["ADMIN", "HR"];

export const DAY_MS = 86_400_000;

/** تاريخ اليوم كتاريخ فقط (منتصف الليل UTC) ليتوافق مع حقول @db.Date. */
export function todayDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function daysUntil(date: Date, from = todayDate()) {
  return Math.round((date.getTime() - from.getTime()) / DAY_MS);
}

/** يحول قيمة نموذج تاريخ (YYYY-MM-DD) إلى Date أو null. */
export function dateInput(value: FormDataEntryValue | null) {
  const s = typeof value === "string" ? value.trim() : "";
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s) : null;
}

/** قيمة input type=date من Date. */
export function toDateInput(date: Date | null | undefined) {
  return date ? date.toISOString().slice(0, 10) : "";
}
