import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { toTree } from "@/lib/departments";
import { t } from "@/i18n";
import { toggleUserActive } from "./actions";
import { DeleteUserButton } from "./delete-button";
import { UserForm } from "./form";

export default async function UsersPage() {
  const admin = await requireRole("ADMIN");
  const [users, departments] = await Promise.all([
    db.user.findMany({ orderBy: { employeeNo: "asc" }, include: { department: true, manager: true } }),
    db.department.findMany({ select: { id: true, name: true, parentId: true, sortOrder: true } }),
  ]);
  const activeUsers = users.filter((u) => u.active).map(({ id, name }) => ({ id, name }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t.users.title}</h1>
      <UserForm departments={toTree(departments).map(({ id, name, depth }) => ({ id, name, depth }))} users={activeUsers} />
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              {[t.users.employeeNo, t.users.name, t.users.jobTitle, t.users.department, t.users.manager, t.users.role, t.users.status, ""].map((h, i) => (
                <th key={i} className="whitespace-nowrap p-3 text-start font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="p-3" dir="ltr">{u.employeeNo}</td>
                <td className="p-3">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-muted" dir="ltr">{u.email}</div>
                  {u.phone && <div className="text-xs text-muted" dir="ltr">{u.phone}</div>}
                </td>
                <td className="p-3">{u.jobTitle ?? t.common.none}</td>
                <td className="p-3">{u.department?.name ?? t.common.none}</td>
                <td className="p-3">{u.manager?.name ?? t.common.none}</td>
                <td className="p-3">{t.roles[u.role]}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${u.active ? "bg-brand-soft text-brand" : "bg-border text-muted"}`}>
                    {u.active ? t.common.active : t.common.inactive}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Link href={`/admin/users/${u.id}`} className="btn-ghost text-xs">{t.common.edit}</Link>
                    {u.id !== admin.id && (
                      <>
                        <form action={toggleUserActive}>
                          <input type="hidden" name="id" value={u.id} />
                          <button className="btn-ghost text-xs">{u.active ? t.common.deactivate : t.common.activate}</button>
                        </form>
                        <DeleteUserButton id={u.id} />
                      </>
                    )}
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
