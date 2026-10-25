-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;

-- مديرو النظام الحاليون اختاروا كلمات مرورهم بأنفسهم
UPDATE "User" SET "mustChangePassword" = false WHERE "role" = 'ADMIN';
