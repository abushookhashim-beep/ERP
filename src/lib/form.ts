import { Prisma } from "@prisma/client";

export type FormState = { error?: string; ok?: boolean } | undefined;

/** يحوّل الحقول الفارغة في النموذج إلى null. */
export function optional(value: FormDataEntryValue | null) {
  const s = typeof value === "string" ? value.trim() : "";
  return s === "" ? null : s;
}

export function isUniqueViolation(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export function isForeignKeyViolation(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003";
}
