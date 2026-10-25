import {
  Building2, CalendarDays, CheckCircle2, CheckSquare, Clock, FileText, Megaphone, UserCheck, UserX, Users,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BarList } from "@/components/dashboard/bar-list";
import { StatTile } from "@/components/dashboard/stat-tile";
import { t } from "@/i18n";

const DASHBOARD_ROLES: Role[] = ["ADMIN", "EXECUTIVE", "HR"];
const TOP_DEPARTMENTS = 8;

const WIDGETS = [
  { title: t.home.myRequests, icon: FileText },
  { title: t.home.pendingApprovals, icon: CheckSquare },
  { title: t.home.latestCirculars, icon: Megaphone },
  { title: t.home.todayMeetings, icon: CalendarDays },
];

export default async function HomePage({ searchParams }: { searchParams: Promise<{ passwordChanged?: string }> }) {
  const user = await requireUser();
  const { passwordChanged } = await searchParams;
  const today = new Intl.DateTimeFormat("ar-SA", { dateStyle: "full" }).format(new Date());

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
        {WIDGETS.map((w) => (
          <section key={w.title} className="card">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <w.icon size={18} className="text-brand" />
              {w.title}
            </h2>
            <p className="py-6 text-center text-sm text-muted">{t.home.empty}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

async function Dashboard() {
  const [active, inactive, departmentCount, perDepartment, perRole, recent] = await Promise.all([
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
  ]);

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
        {/* تُربط بجدول الطلبات عند بناء قسم الطلبات والتعميد */}
        <StatTile label={t.home.pendingRequests} value={null} icon={Clock} hint={t.home.requestsSoon} />
        <StatTile label={t.home.completedRequests} value={null} icon={CheckCircle2} hint={t.home.requestsSoon} />
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
