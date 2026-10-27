-- تحويل الأدوار الثابتة إلى أدوار قابلة للتعديل، مع الإبقاء على دور كل مستخدم وصلاحياته كما هي.

-- AlterTable: نربط كل مستخدم بمعرّف دوره الجديد قبل حذف العمود القديم
ALTER TABLE "User" ADD COLUMN "roleId" TEXT NOT NULL DEFAULT 'role_employee';
UPDATE "User" SET "roleId" = 'role_' || lower("role"::text);
ALTER TABLE "User" DROP COLUMN "role";

-- DropEnum (يجب حذفه قبل إنشاء جدول بنفس الاسم)
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "system" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- الأدوار الأساسية بصلاحياتها السابقة نفسها
INSERT INTO "Role" ("id", "name", "description", "permissions", "system", "updatedAt") VALUES
('role_admin', 'مدير النظام', 'إعداد المنصة وإدارة المستخدمين', ARRAY['admin.users','admin.roles','admin.departments','admin.approvalSettings','admin.rooms','dashboard.view','requests.viewAll','requests.sendPledge','hr.view','hr.edit','hr.policy','support.manage','circulars.publishAll','circulars.viewAll','circulars.trackAll','finance.view'], true, CURRENT_TIMESTAMP),
('role_executive', 'الإدارة العليا', 'مجلس الإدارة والرئيس التنفيذي ونوابه', ARRAY['dashboard.view','requests.viewAll','requests.approveExecutive','hr.view','circulars.publishAll','circulars.viewAll','circulars.trackAll','finance.view'], true, CURRENT_TIMESTAMP),
('role_hr', 'الموارد البشرية', 'موظفو إدارة الموارد البشرية', ARRAY['dashboard.view','requests.viewAll','requests.approveHr','requests.sendPledge','hr.view','hr.edit','hr.policy','circulars.publishAll','circulars.viewAll'], true, CURRENT_TIMESTAMP),
('role_finance', 'المالية', 'موظفو الإدارة المالية', ARRAY['finance.view'], true, CURRENT_TIMESTAMP),
('role_it', 'تقنية المعلومات', 'موظفو إدارة تقنية المعلومات', ARRAY['requests.sendPledge','support.manage'], true, CURRENT_TIMESTAMP),
('role_employee', 'موظف', 'الدور الافتراضي لكل موظف', ARRAY[]::TEXT[], true, CURRENT_TIMESTAMP);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
