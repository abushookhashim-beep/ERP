import {
  Building2, CalendarDays, CheckCircle2, CheckSquare, Clock, FileText, Megaphone, UserCheck, UserX, Users,
} from "lucide-react";
import Link from "next/link";
import type { Role } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { actionableStepsWhere, formatRequestNumber } from "@/lib/requests";
import { StatusBadge } from "@/components/requests/status-badge";
import { BarList } from "@/components/dashboard/bar-list";
import { StatTile } from "@/components/dashboard/stat-tile";
import { t } from "@/i18n";

const DASHBOARD_ROLES: Role[] = ["ADMIN", "EXECUTIVE", "HR"];
const TOP_DEPARTMENTS = 8;

const WIDGET_LIMIT = 5;
const subtypeLabel = (s: string) => t.requests.subtypes[s as keyof typeof t.requests.subtypes];

export default async function HomePage({ searchParams }: { searchParams: Promise<{ passwordChanged?: string }> }) {
  const user = await requireUser();
  const { passwordChanged } = await searchParams;
  const today = new Intl.DateTimeFormat("ar-SA", { dateStyle: "full" }).format(new Date());
  const [myRequests, approvals] = await Promise.all([
    db.request.findMany({
      where: { subjectId: user.id },
      orderBy: { createdAt: "desc" },
      take: WIDGET_LIMIT,
      select: { id: true, number: true, type: true, subtype: true, status: true, createdAt: true },
    }),
    db.approvalStep.findMany({
      where: actionableStepsWhere(user),
      orderBy: { request: { createdAt: "asc" } },
      take: WIDGET_LIMIT,
      select: { id: true, request: { select: { id: true, subtype: true, createdAt: true, subject: { select: { name: true } } } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      {passwordChanged && (
        <p className="rounded-lg bg-brand-soft p-3 text-sm text-brand" role="status">{t.changePassword.success}</p>
      )}
      <div>
        <h1 className="text-2xl font-semibold">{t.home.greeting}، {user.name.split(" ")[0]} 👋</h1>
        <p className="mt-1 text-sm text-muted">{today}</p>
      </div>

      {DASHBOARD_ROLES.includes(user.role) && <Dashboard />}

      <div className="grid gap-4 md:grid-cols-2">
        <Widget title={t.home.myRequests} icon={FileText} href="/requests">
          {myRequests.map((r) => (
            <li key={r.id}>
              <Link href={`/requests/${r.id}`} className="flex items-center justify-between gap-3 py-2 hover:text-brand">
                <span>
                  <span className="block font-medium">{subtypeLabel(r.subtype)}</span>
                  <span className="text-xs text-muted" dir="ltr">{formatRequestNumber(r.number)}</span>
                </span>
                <StatusBadge status={r.status} type={r.type} />
              </Link>
            </li>
          ))}
        </Widget>
        <Widget title={t.home.pendingApprovals} icon={CheckSquare} href="/approvals">
          {approvals.map(({ id, request: r }) => (
            <li key={id}>
              <Link href={`/requests/${r.id}`} className="block py-2 hover:text-brand">
                <span className="block font-medium">{subtypeLabel(r.subtype)} · {r.subject.name}</span>
                <span className="text-xs text-muted">{formatDateTime(r.createdAt)}</span>
              </Link>
            </li>
          ))}
        </Widget>
        <Widget title={t.home.latestCirculars} icon={Megaphone} />
        <Widget title={t.home.todayMeetings} icon={CalendarDays} />
      </div>
    </div>
  );
}

function Widget({ title, icon: Icon, href, children }: {
  title: string; icon: typeof FileText; href?: string; children?: React.ReactNode[];
}) {
  return (
    <section className="card">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <Icon size={18} className="text-brand" />
          {title}
        </h2>
        {href && children && children.length > 0 && <Link href={href} className="text-xs text-brand">{t.home.viewAll}</Link>}
      </div>
      {children && children.length > 0
        ? <ul className="divide-y divide-border text-sm">{children}</ul>
        : <p className="py-6 text-center text-sm text-muted">{t.home.empty}</p>}
    </section>
  );
}

async function Dashboard() {
  const [active, inactive, departmentCount, perDepartment, perRole, recent, requestCounts] = await Promise.all([
    db.user.count({ where: { active: true } }),
    db.user.count({ where: { active: false } }),
    db.department.count(),
    db.department.findMany({
      select: { name: true, _count: { select: { members: { where: { active: true } } } } },
    }),
    db.user.groupBy({ by: ["role"], where: { active: true }, _count: true }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, jobTitle: true, department: { select: { name: true } } },
    }),
    db.request.groupBy({ by: ["status"], _count: true }),
  ]);
  const countOf = (status: string) => requestCounts.find((r) => r.status === status)?._count ?? 0;
  const approved = countOf("APPROVED");
  const rejected = countOf("REJECTED");

  const staffed = perDepartment
    .map((d) => ({ label: d.name, value: d._count.members }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const departmentRows = staffed.slice(0, TOP_DEPARTMENTS);
  const rest = staffed.slice(TOP_DEPARTMENTS).reduce((sum, d) => sum + d.value, 0);
  if (rest > 0) departmentRows.push({ label: t.home.others, value: rest });

  const roleRows = perRole
    .map((r) => ({ label: t.roles[r.role], value: r._count }))
    .sort((a, b) => b.value - a.value);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{t.home.dashboard}</h2>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatTile label={t.home.totalEmployees} value={active + inactive} icon={Users} />
        <StatTile label={t.home.activeEmployees} value={active} icon={UserCheck} />
        <StatTile label={t.home.inactiveEmployees} value={inactive} icon={UserX} />
        <StatTile label={t.home.departments} value={departmentCount} icon={Building2} />
        <StatTile label={t.home.pendingRequests} value={countOf("PENDING")} icon={Clock} />
        <StatTile label={t.home.completedRequests} value={approved + rejected} icon={CheckCircle2}
          hint={t.home.completedSplit(approved, rejected)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h3 className="font-semibold">{t.home.byDepartment}</h3>
          <p className="mb-5 text-xs text-muted">{t.home.byDepartmentHint}</p>
          {departmentRows.length > 0
            ? <BarList rows={departmentRows} unit={t.home.employeesUnit} />
            : <p className="py-6 text-center text-sm text-muted">{t.home.noAssignments}</p>}
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="mb-5 font-semibold">{t.home.byRole}</h3>
            <BarList rows={roleRows} unit={t.home.employeesUnit} />
          </div>
          <div className="card">
            <h3 className="mb-3 font-semibold">{t.home.recentEmployees}</h3>
            <ul className="divide-y divide-border text-sm">
              {recent.map((u) => (
                <li key={u.id} className="py-2">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-muted">
                    {[u.jobTitle, u.department?.name].filter(Boolean).join(" · ") || t.common.none}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
