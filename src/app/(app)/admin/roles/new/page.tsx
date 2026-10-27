import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { t } from "@/i18n";
import { RoleForm } from "../role-form";

export default async function NewRolePage() {
  await requirePermission("admin.roles");
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/roles" className="text-sm text-brand">← {t.roles.back}</Link>
        <h1 className="mt-2 text-2xl font-semibold">{t.roles.new}</h1>
      </div>
      <RoleForm role={null} canDelete={false} />
    </div>
  );
}
