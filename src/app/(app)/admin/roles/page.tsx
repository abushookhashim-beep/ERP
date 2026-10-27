import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { t } from "@/i18n";

export default async function RolesPage() {
  await requirePermission("admin.roles");
  const roles = await db.role.findMany({
    orderBy: [{ system: "desc" }, { name: "asc" }],
    include: { _count: { select: { users: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t.roles.title}</h1>
          <p className="text-sm text-muted">{t.roles.hint}</p>
        </div>
        <Link href="/admin/roles/new" className="btn"><Plus size={16} />{t.roles.new}</Link>
      </div>
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((r) => (
          <li key={r.id}>
            <Link href={`/admin/roles/${r.id}`} className="card flex h-full flex-col gap-2 transition hover:border-brand">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{r.name}</span>
                {r.system && <span className="rounded-full bg-border px-2 py-0.5 text-xs text-muted">{t.roles.system}</span>}
              </div>
              {r.description && <p className="text-sm text-muted">{r.description}</p>}
              <p className="mt-auto text-xs text-muted">
                {t.roles.users(r._count.users)} · {r.permissions.length ? t.roles.permCount(r.permissions.length) : t.roles.noPermissions}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
