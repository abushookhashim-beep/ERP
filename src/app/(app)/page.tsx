import {
  BellRing, Building2, CalendarDays, CheckCircle2, CheckSquare, Clock, FileText, ListTodo, Megaphone, UserCheck, UserX, Users,
} from "lucide-react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";
import { actionableStepsWhere, formatRequestNumber } from "@/lib/requests";
import { StatusBadge } from "@/components/requests/status-badge";
import { LeaveBalanceCard } from "@/components/hr/leave-balance-card";
import { alertCount, getHrAlerts } from "@/lib/hr-alerts";
import { getAnnualBalance, getLeavePolicy } from "@/lib/leave";
import { participatesWhere, riyadhDay, riyadhDayRange } from "@/lib/meetings";
import { activeWhere, visibleWhere } from "@/lib/circulars";
import { can } from "@/lib/permissions";
import { formatTimeRange } from "@/components/meetings/meeting-card";
import { BarList } from "@/components/dashboard/bar-list";
import { StatTile } from "@/components/dashboard/stat-tile";
import { t } from "@/i18n";

const TOP_DEPARTMENTS = 8;

const WIDGET_LIMIT = 5;
const subtypeLabel = (s: string) => t.requests.subtypes[s as keyof typeof t.requests.subtypes];

export default async function HomePage({ searchParams }: { searchParams: Promise<{ passwordChanged?: string }> }) {
  const user = await requireUser();
  const { passwordChanged } = await searchParams;
  const today = new Intl.DateTimeFormat("ar-SA", { dateStyle: "full" }).format(new Date());
  const policy = await getLeavePolicy();
  const { start: dayStart, end: dayEnd } = riyadhDayRange(riyadhDay(new Date()));
  const [myRequests, approvals, balance, todayMeetings, myTasks, circulars] = await Promise.all([
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
    db.employeeProfile.findUnique({ where: { userId: user.id } }).then((p) => getAnnualBalance(user.id, p, policy)),
    db.meeting.findMany({
      where: { ...participatesWhere(user.id), status: { not: "CANCELLED" }, startsAt: { gte: dayStart, lt: dayEnd } },
      orderBy: { startsAt: "asc" },
      select: { id: true, title: true, startsAt: true, endsAt: true, room: { select: { name: true } } },
    }),
    db.task.findMany({
      where: { assigneeId: user.id, status: { not: "DONE" } },
      orderBy: { dueDate: "asc" },
      take: WIDGET_LIMIT,
      select: { id: true, title: true, dueDate: true, meeting: { select: { title: true } }, createdBy: { select: { name: true } } },
    }),
    db.circular.findMany({
      where: { AND: [visibleWhere(user), activeWhere()] },
      orderBy: { createdAt: "desc" },
      take: WIDGET_LIMIT,
      select: {
        id: true, title: true, important: true, createdAt: true,
        recipients: { where: { userId: user.id }, select: { readAt: true } },
      },
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

      {can(user, "dashboard.view") && <Dashboard alertDays={policy.alertDays} />}

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
        <LeaveBalanceCard balance={balance} />
        <Widget title={t.home.latestCirculars} icon={Megaphone} href="/circulars">
          {circulars.map((cr) => {
            const unread = cr.recipients[0] && !cr.recipients[0].readAt;
            return (
              <li key={cr.id}>
                <Link href={`/circulars/${cr.id}`} className="flex items-center justify-between gap-2 py-2 hover:text-brand">
                  <span>
                    <span className={`block ${unread ? "font-bold" : "font-medium"}`}>{cr.title}</span>
                    <span className="text-xs text-muted">{formatDate(cr.createdAt)}</span>
                  </span>
                  {cr.important && <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger">{t.circulars.important}</span>}
                  {unread && !cr.important && <span className="rounded-full bg-brand px-2 py-0.5 text-xs text-white">{t.circulars.unread}</span>}
                </Link>
              </li>
            );
          })}
        </Widget>
        <Widget title={t.home.todayMeetings} icon={CalendarDays} href="/meetings">
          {todayMeetings.map((mt) => (
            <li key={mt.id}>
              <Link href={`/meetings/${mt.id}`} className="block py-2 hover:text-brand">
                <span className="block font-medium">{mt.title}</span>
                <span className="text-xs text-muted">{formatTimeRange(mt.startsAt, mt.endsAt)}{mt.room && ` · ${mt.room.name}`}</span>
              </Link>
            </li>
          ))}
        </Widget>
        <Widget title={t.home.myTasks} icon={ListTodo} href="/tasks">
          {myTasks.map((task) => (
            <li key={task.id}>
              <Link href={`/tasks/${task.id}`} className="block py-2 hover:text-brand">
                <span className="block font-medium">{task.title}</span>
                <span className="text-xs text-muted">{task.meeting?.title ?? t.tasks.direct(task.createdBy.name)}{task.dueDate && ` · ${formatDate(task.dueDate)}`}</span>
              </Link>
            </li>
          ))}
        </Widget>
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

async function Dashboard({ alertDays }: { alertDays: number }) {
  const [active, inactive, departmentCount, perDepartment, perRole, recent, requestCounts, hrAlerts] = await Promise.all([
    db.user.count({ where: { active: true } }),
    db.user.count({ where: { active: false } }),
    db.department.count(),
    db.department.findMany({
      select: { name: true, _count: { select: { members: { where: { active: true } } } } },
    }),
    db.role.findMany({ select: { name: true, _count: { select: { users: { where: { active: true } } } } } }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, jobTitle: true, department: { select: { name: true } } },
    }),
    db.request.groupBy({ by: ["status"], _count: true }),
    getHrAlerts(alertDays),
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
    .map((r) => ({ label: r.name, value: r._count.users }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{t.home.dashboard}</h2>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label={t.home.totalEmployees} value={active + inactive} icon={Users} />
        <StatTile label={t.home.activeEmployees} value={active} icon={UserCheck} />
        <StatTile label={t.home.inactiveEmployees} value={inactive} icon={UserX} />
        <StatTile label={t.home.departments} value={departmentCount} icon={Building2} />
        <StatTile label={t.home.pendingRequests} value={countOf("PENDING")} icon={Clock} />
        <StatTile label={t.home.completedRequests} value={approved + rejected} icon={CheckCircle2}
          hint={t.home.completedSplit(approved, rejected)} />
        <Link href="/hr" className="contents">
          <StatTile label={t.home.hrAlerts} value={alertCount(hrAlerts)} icon={BellRing} hint={t.home.hrAlertsHint} />
        </Link>
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
