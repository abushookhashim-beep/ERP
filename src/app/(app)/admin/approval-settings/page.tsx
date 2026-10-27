import type { RequestType } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { APPROVAL_PATHS, getCeoId } from "@/lib/requests";
import { t } from "@/i18n";
import { ApprovalSettingsForm } from "./form";

export default async function ApprovalSettingsPage() {
  await requirePermission("admin.approvalSettings");
  const [users, ceoId] = await Promise.all([
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    getCeoId(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t.approvalSettings.title}</h1>
      <ApprovalSettingsForm users={users} ceoId={ceoId} />
      <section className="card max-w-xl">
        <h2 className="mb-4 font-semibold">{t.approvalSettings.paths}</h2>
        <ul className="space-y-3 text-sm">
          {(Object.keys(APPROVAL_PATHS) as RequestType[]).map((type) => (
            <li key={type}>
              <p className="font-medium">{t.requests.types[type]}</p>
              <p className="text-muted">{APPROVAL_PATHS[type].map((k) => t.requests.approverKinds[k]).join(" ← ")}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
