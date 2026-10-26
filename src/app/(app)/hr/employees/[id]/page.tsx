import Link from "next/link";
import { notFound } from "next/navigation";
import type { EmployeeProfile } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ACCEPT_ATTR } from "@/lib/files";
import { HR_EDIT_ROLES, HR_VIEW_ROLES, toDateInput } from "@/lib/hr";
import { getAnnualBalance, getLeavePolicy, getSickDaysInYear } from "@/lib/leave";
import { DocumentsTable } from "@/components/hr/documents-table";
import { LeaveBalanceCard } from "@/components/hr/leave-balance-card";
import { RequestTable } from "@/components/requests/request-table";
import { t } from "@/i18n";
import { DeleteDocumentButton } from "./delete-document";
import { DocumentForm } from "./document-form";
import { ProfileForm, type ProfileValues } from "./profile-form";

/** يحول الملف إلى قيم نصية لحقول النموذج. */
function toValues(p: EmployeeProfile | null): ProfileValues {
  if (!p) return {};
  const out: ProfileValues = {};
  for (const [k, v] of Object.entries(p)) {
    if (v === null || k === "id" || k === "userId" || k === "updatedAt") continue;
    out[k] = v instanceof Date ? toDateInput(v) : String(v);
  }
  return out;
}

export default async function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireRole(...HR_VIEW_ROLES);
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    include: {
      department: { select: { name: true } },
      manager: { select: { name: true } },
      profile: true,
      documents: { orderBy: [{ expiryDate: "asc" }, { createdAt: "desc" }] },
    },
  });
  if (!user) notFound();

  const policy = await getLeavePolicy();
  const [balance, sickUsed, requests] = await Promise.all([
    getAnnualBalance(user.id, user.profile, policy),
    getSickDaysInYear(user.id, new Date().getFullYear()),
    db.request.findMany({
      where: { subjectId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { subject: { select: { name: true } } },
    }),
  ]);
  const canEdit = HR_EDIT_ROLES.includes(viewer.role);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/hr" className="text-sm text-brand">← {t.hr.title}</Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
          <h1 className="text-2xl font-semibold">{user.name}</h1>
          {!user.active && <span className="rounded-full bg-border px-2 py-0.5 text-xs text-muted">{t.common.inactive}</span>}
        </div>
        <p className="text-sm text-muted">
          {[user.employeeNo, user.jobTitle, user.department?.name, user.manager && `${t.users.manager}: ${user.manager.name}`]
            .filter(Boolean).join(" · ")}
        </p>
        <p className="text-sm text-muted">
          <span dir="ltr">{[user.email, user.phone, user.nationalId].filter(Boolean).join(" · ")}</span>
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ProfileForm userId={user.id} values={toValues(user.profile)} canEdit={canEdit} showFinancial />
        </div>
        <div className="space-y-6">
          <LeaveBalanceCard balance={balance} sickInfo={t.hr.leave.sickThisYear(sickUsed, policy.sickDaysPerYear)} />
        </div>
      </div>

      <section className="card space-y-4">
        <h2 className="font-semibold">{t.hr.sections.documents}</h2>
        <DocumentsTable
          docs={user.documents}
          alertDays={policy.alertDays}
          actions={canEdit ? (docId) => <DeleteDocumentButton id={docId} /> : undefined}
        />
        {canEdit && <DocumentForm userId={user.id} accept={ACCEPT_ATTR} />}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">{t.hr.sections.requests}</h2>
        <RequestTable rows={requests} />
      </section>
    </div>
  );
}
