import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { toTree } from "@/lib/departments";
import { t } from "@/i18n";
import { DeleteDepartmentButton } from "./delete-button";
import { DepartmentForm } from "./form";

export default async function DepartmentsPage() {
  await requireRole("ADMIN");
  const [departments, users] = await Promise.all([
    db.department.findMany({
      include: { head: true, _count: { select: { members: true, children: true } } },
    }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const tree = toTree(departments);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t.departments.title}</h1>
      <DepartmentForm departments={tree.map(({ id, name, depth }) => ({ id, name, depth }))} users={users} />
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              <th className="p-3 text-start font-medium">{t.departments.name}</th>
              <th className="p-3 text-start font-medium">{t.departments.head}</th>
              <th className="p-3 text-start font-medium">{t.departments.members}</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {tree.map((d) => (
              <tr key={d.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  <div className="flex items-center gap-2" style={{ paddingInlineStart: `${d.depth * 1.5}rem` }}>
                    {d.depth > 0 && <span className="text-border">└</span>}
                    <span className={d._count.children > 0 ? "font-semibold" : ""}>{d.name}</span>
                  </div>
                </td>
                <td className="p-3">{d.head?.name ?? t.common.none}</td>
                <td className="p-3">{d._count.members}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/departments/${d.id}`} className="btn-ghost text-xs">{t.common.edit}</Link>
                    {d._count.members === 0 && d._count.children === 0 && <DeleteDepartmentButton id={d.id} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
