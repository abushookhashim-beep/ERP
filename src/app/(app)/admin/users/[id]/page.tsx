import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { toTree } from "@/lib/departments";
import { t } from "@/i18n";
import { EditUserForm } from "./edit-form";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireRole("ADMIN");
  const { id } = await params;
  const [user, departments, users] = await Promise.all([
    // لا نرسل passwordHash إلى المتصفح
    db.user.findUnique({
      where: { id },
      select: {
        id: true, employeeNo: true, name: true, email: true, role: true, active: true,
        jobTitle: true, phone: true, departmentId: true, managerId: true,
      },
    }),
    db.department.findMany({ select: { id: true, name: true, parentId: true, sortOrder: true } }),
    db.user.findMany({ where: { active: true, NOT: { id } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!user) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users" className="text-sm text-brand">← {t.users.back}</Link>
        <h1 className="mt-2 text-2xl font-semibold">{t.users.edit}</h1>
      </div>
      <EditUserForm
        user={user}
        departments={toTree(departments).map(({ id, name, depth }) => ({ id, name, depth }))}
        managers={users}
        isSelf={user.id === admin.id}
      />
    </div>
  );
}
