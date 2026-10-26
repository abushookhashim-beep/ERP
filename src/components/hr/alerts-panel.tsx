import Link from "next/link";
import { AlertTriangle, CalendarClock, FileWarning, UserRoundCheck } from "lucide-react";
import { daysUntil } from "@/lib/hr";
import type { getHrAlerts, HrAlert } from "@/lib/hr-alerts";
import { formatDate } from "@/lib/format";
import { t } from "@/i18n";

type Alerts = Awaited<ReturnType<typeof getHrAlerts>>;

const docLabel = (type: string) => t.hr.documents.types[type as keyof typeof t.hr.documents.types] ?? type;

export function AlertsPanel({ alerts }: { alerts: Alerts }) {
  const groups = [
    { key: "expiredDocs", title: t.hr.expiredDocs, icon: AlertTriangle, tone: "text-danger", items: alerts.expiredDocs, doc: true },
    { key: "expiringDocs", title: t.hr.expiringDocs, icon: FileWarning, tone: "text-accent", items: alerts.expiringDocs, doc: true },
    { key: "contractsEnding", title: t.hr.contractsEnding, icon: CalendarClock, tone: "text-accent", items: alerts.contractsEnding, doc: false },
    { key: "probationEnding", title: t.hr.probationEnding, icon: UserRoundCheck, tone: "text-brand", items: alerts.probationEnding, doc: false },
  ].filter((g) => g.items.length > 0);

  if (groups.length === 0) return <p className="card py-8 text-center text-sm text-muted">{t.hr.noAlerts}</p>;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {groups.map((g) => (
        <section key={g.key} className="card">
          <h3 className="mb-3 flex items-center gap-2 font-semibold">
            <g.icon size={18} className={g.tone} />
            {g.title}
            <span className="rounded-full bg-border px-2 text-xs">{g.items.length}</span>
          </h3>
          <ul className="divide-y divide-border text-sm">
            {g.items.slice(0, 8).map((a: HrAlert) => (
              <li key={a.id}>
                <Link href={`/hr/employees/${a.userId}`} className="flex items-center justify-between gap-3 py-2 hover:text-brand">
                  <span>
                    <span className="font-medium">{a.name}</span>
                    {g.doc && <span className="text-muted"> · {docLabel(a.label)}</span>}
                  </span>
                  <span className={`whitespace-nowrap text-xs ${g.tone}`}>
                    {formatDate(a.date)} · {daysUntil(a.date) < 0 ? t.hr.agoDays(-daysUntil(a.date)) : t.hr.inDays(daysUntil(a.date))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
