import Link from "next/link";
import { Search, Settings } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { HR_EDIT_ROLES, HR_VIEW_ROLES } from "@/lib/hr";
import { getHrAlerts } from "@/lib/hr-alerts";
import { getLeavePolicy } from "@/lib/leave";
import { AlertsPanel } from "@/components/hr/alerts-panel";
import { t } from "@/i18n";

export default async function HrPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireRole(...HR_VIEW_ROLES);
  const q = (await searchParams).q?.trim() ?? "";
  const where: Prisma.UserWhereInput = q
    ? { OR: [
        { name: { contains: q, mode: "insensitive" } },
        { employeeNo: { contains: q, mode: "insensitive" } },
        { nationalId: { contains: q } },
      ] }
    : {};

  const policy = await getLeavePolicy();
  const [alerts, employees] = await Promise.all([
    getHrAlerts(policy.alertDays),
    db.user.findMany({
      where: { active: true, ...where },
      orderBy: { name: "asc" },
      select: {
        id: true, name: true, employeeNo: true, jobTitle: true,
        department: { select: { name: true } },
        profile: { select: { hireDate: true, contractType: true } },
        _count: { select: { documents: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t.hr.title}</h1>
        {HR_EDIT_ROLES.includes(user.role) && (
          <Link href="/hr/settings" className="btn-ghost"><Settings size={16} />{t.hr.settings}</Link>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t.hr.alerts}</h2>
        <AlertsPanel alerts={alerts} />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{t.hr.employees} <span className="text-sm font-normal text-muted">({employees.length})</span></h2>
          <form className="relative w-full sm:w-80">
            <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={q} placeholder={t.hr.search} className="input ps-9" />
          </form>
        </div>
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                {[t.users.name, t.users.department, t.hr.fields.contractType, t.hr.fields.hireDate, t.hr.sections.documents, ""].map((h, i) => (
                  <th key={i} className="whitespace-nowrap p-3 text-start font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="p-3">
                    <div className="font-medium">{e.name}</div>
                    <div className="text-xs text-muted">{[e.employeeNo, e.jobTitle].filter(Boolean).join(" · ")}</div>
                  </td>
                  <td className="p-3">{e.department?.name ?? t.common.none}</td>
                  <td className="p-3">
                    {e.profile?.contractType ? t.hr.contractTypes[e.profile.contractType] : t.common.none}
                  </td>
                  <td className="whitespace-nowrap p-3">
                    {e.profile?.hireDate
                      ? formatDate(e.profile.hireDate)
                      : <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs">{t.hr.incomplete}</span>}
                  </td>
                  <td className="p-3">{e._count.documents}</td>
                  <td className="p-3 text-end">
                    <Link href={`/hr/employees/${e.id}`} className="btn-ghost text-xs">{t.hr.viewProfile}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
