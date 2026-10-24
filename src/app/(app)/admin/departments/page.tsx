import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { t } from "@/i18n";
import { DepartmentForm } from "./form";

export default async function DepartmentsPage() {
  await requireRole("ADMIN");
  const [departments, users] = await Promise.all([
    db.department.findMany({
      orderBy: { name: "asc" },
      include: { parent: true, head: true, _count: { select: { members: true } } },
    }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t.departments.title}</h1>
      <DepartmentForm departments={departments.map(({ id, name }) => ({ id, name }))} users={users} />
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-muted">
            <tr className="text-start">
              <th className="p-3 text-start font-medium">{t.departments.name}</th>
              <th className="p-3 text-start font-medium">{t.departments.parent}</th>
              <th className="p-3 text-start font-medium">{t.departments.head}</th>
              <th className="p-3 text-start font-medium">{t.departments.members}</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <tr key={d.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium">{d.name}</td>
                <td className="p-3">{d.parent?.name ?? t.common.none}</td>
                <td className="p-3">{d.head?.name ?? t.common.none}</td>
                <td className="p-3">{d._count.members}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
