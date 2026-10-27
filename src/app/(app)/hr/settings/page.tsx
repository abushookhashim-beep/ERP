import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getLeavePolicy } from "@/lib/leave";
import { t } from "@/i18n";
import { PolicyForm } from "./form";

export default async function HrSettingsPage() {
  await requirePermission("hr.policy");
  return (
    <div className="space-y-6">
      <div>
        <Link href="/hr" className="text-sm text-brand">← {t.hr.title}</Link>
        <h1 className="mt-2 text-2xl font-semibold">{t.hr.policy.title}</h1>
      </div>
      <PolicyForm policy={await getLeavePolicy()} />
    </div>
  );
}
