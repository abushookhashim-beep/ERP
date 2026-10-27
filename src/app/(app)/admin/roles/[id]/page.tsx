import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { t } from "@/i18n";
import { RoleForm } from "../role-form";

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("admin.roles");
  const role = await db.role.findUnique({
    where: { id: (await params).id },
    include: { users: { orderBy: { name: "asc" }, select: { id: true, name: true, jobTitle: true, active: true } } },
  });
  if (!role) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/roles" className="text-sm text-brand">← {t.roles.back}</Link>
        <h1 className="mt-2 text-2xl font-semibold">{t.roles.edit}: {role.name}</h1>
      </div>
      <RoleForm
        role={{ id: role.id, name: role.name, description: role.description, permissions: role.permissions, system: role.system }}
        canDelete={!role.system && role.users.length === 0}
      />
      <section className="card">
        <h2 className="mb-3 font-semibold">{t.roles.members} ({role.users.length})</h2>
        {role.users.length === 0 ? (
          <p className="text-sm text-muted">{t.roles.noMembers}</p>
        ) : (
          <ul className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {role.users.map((u) => (
              <li key={u.id}>
                <Link href={`/admin/users/${u.id}`} className={`hover:text-brand ${u.active ? "" : "text-muted line-through"}`}>{u.name}</Link>
                {u.jobTitle && <span className="text-xs text-muted"> · {u.jobTitle}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
