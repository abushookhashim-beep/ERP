import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getAnnualBalance, getLeavePolicy, getSickDaysInYear } from "@/lib/leave";
import { DocumentsTable } from "@/components/hr/documents-table";
import { LeaveBalanceCard } from "@/components/hr/leave-balance-card";
import { t } from "@/i18n";

export default async function MyProfilePage() {
  const user = await requireUser();
  const [profile, documents, policy] = await Promise.all([
    db.employeeProfile.findUnique({ where: { userId: user.id } }),
    db.employeeDocument.findMany({ where: { userId: user.id }, orderBy: { expiryDate: "asc" } }),
    getLeavePolicy(),
  ]);
  const [balance, sickUsed] = await Promise.all([
    getAnnualBalance(user.id, profile, policy),
    getSickDaysInYear(user.id, new Date().getFullYear()),
  ]);
  const f = t.hr.fields;

  const rows: [string, string | null | undefined][] = [
    [t.users.employeeNo, user.employeeNo],
    [t.users.jobTitle, user.jobTitle],
    [t.users.department, user.department?.name],
    [t.users.email, user.email],
    [t.users.phone, user.phone],
    [t.users.nationalId, user.nationalId],
    [f.nationality, profile?.nationality],
    [f.birthDate, profile?.birthDate && formatDate(profile.birthDate)],
    [f.hireDate, profile?.hireDate && formatDate(profile.hireDate)],
    [f.contractType, profile?.contractType && t.hr.contractTypes[profile.contractType]],
    [f.contractEnd, profile?.contractEnd && formatDate(profile.contractEnd)],
    [f.workLocation, profile?.workLocation],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{user.name}</h1>
        <p className="text-sm text-muted">{t.profile.hrOnly}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted">{label}</dt>
                <dd className="font-medium">{value || t.common.none}</dd>
              </div>
            ))}
          </dl>
        </section>
        <LeaveBalanceCard balance={balance} sickInfo={t.hr.leave.sickThisYear(sickUsed, policy.sickDaysPerYear)} />
      </div>
      <section className="card">
        <h2 className="mb-3 font-semibold">{t.hr.sections.documents}</h2>
        <DocumentsTable docs={documents} alertDays={policy.alertDays} />
      </section>
    </div>
  );
}
