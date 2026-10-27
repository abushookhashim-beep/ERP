import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { descendantIds, toTree } from "@/lib/departments";
import { t } from "@/i18n";
import { EditDepartmentForm } from "./edit-form";

export default async function EditDepartmentPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("admin.departments");
  const { id } = await params;
  const [departments, users] = await Promise.all([
    db.department.findMany(),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const department = departments.find((d) => d.id === id);
  if (!department) notFound();

  const excluded = descendantIds(departments, id);
  const parents = toTree(departments)
    .filter((d) => !excluded.has(d.id))
    .map(({ id, name, depth }) => ({ id, name, depth }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/departments" className="text-sm text-brand">← {t.departments.back}</Link>
        <h1 className="mt-2 text-2xl font-semibold">{t.departments.edit}</h1>
      </div>
      <EditDepartmentForm department={department} parents={parents} users={users} />
    </div>
  );
}
