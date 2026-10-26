import "server-only";
import { db } from "./db";

export const MAX_FILE_SIZE = 4 * 1024 * 1024;
export const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
export const ACCEPT_ATTR = ".pdf,.jpg,.jpeg,.png,.webp";

/** يرجع الملف إذا رُفع فعلاً (المتصفح يرسل ملفاً فارغاً عند عدم الاختيار). */
export function uploadedFile(value: FormDataEntryValue | null) {
  return value instanceof File && value.size > 0 ? value : null;
}

export type FileError = "tooLarge" | "badType";

export function checkFile(file: File): FileError | null {
  if (file.size > MAX_FILE_SIZE) return "tooLarge";
  if (!ALLOWED_MIME.includes(file.type)) return "badType";
  return null;
}

export async function storeFile(file: File, uploadedById: string) {
  const stored = await db.storedFile.create({
    data: {
      name: file.name,
      mime: file.type,
      size: file.size,
      data: Buffer.from(await file.arrayBuffer()),
      uploadedById,
    },
    select: { id: true },
  });
  return stored.id;
}
