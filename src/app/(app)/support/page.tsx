import Link from "next/link";
import { Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { can } from "@/lib/permissions";
import { formatTicketNumber } from "@/lib/support";
import { PriorityBadge } from "@/components/priority-badge";
import { TicketStatusBadge } from "@/components/support/ticket-status";
import { t } from "@/i18n";

type Tab = "mine" | "inbox" | "assigned" | "all";
const s = t.support;

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUser();
  const isSupport = can(user, "support.manage");
  const tabs: { key: Tab; label: string }[] = isSupport
    ? [{ key: "inbox", label: s.inbox }, { key: "assigned", label: s.assignedToMe }, { key: "all", label: s.all }, { key: "mine", label: s.mine }]
    : [{ key: "mine", label: s.mine }];
  const requested = (await searchParams).tab as Tab;
  const tab = tabs.some((x) => x.key === requested) ? requested : tabs[0].key;

  const where: Prisma.TicketWhereInput =
    tab === "inbox" ? { status: { notIn: ["RESOLVED", "CLOSED"] } } :
    tab === "assigned" ? { assigneeId: user.id, status: { notIn: ["CLOSED"] } } :
    tab === "all" ? {} :
    { requesterId: user.id };

  const tickets = await db.ticket.findMany({
    where,
    // التذاكر الجديدة والعاجلة أولاً
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    take: 200,
    include: { requester: { select: { name: true } }, assignee: { select: { name: true } } },
  });
  const forSupport = isSupport && tab !== "mine";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{s.title}</h1>
        <Link href="/support/new" className="btn"><Plus size={16} />{s.new}</Link>
      </div>
      {tabs.length > 1 && (
        <nav className="flex gap-1 overflow-x-auto border-b border-border">
          {tabs.map((x) => (
            <Link key={x.key} href={`/support?tab=${x.key}`}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm ${tab === x.key ? "border-brand font-semibold text-brand" : "border-transparent text-muted"}`}>
              {x.label}
            </Link>
          ))}
        </nav>
      )}

      {tickets.length === 0 ? (
        <p className="card py-12 text-center text-sm text-muted">{s.empty}</p>
      ) : (
        <ul className="card divide-y divide-border p-0">
          {tickets.map((tk) => (
            <li key={tk.id}>
              <Link href={`/support/${tk.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-brand-soft/40">
                <div className="min-w-0">
                  <p className="font-medium">{tk.title}</p>
                  <p className="text-xs text-muted">
                    <span dir="ltr">{formatTicketNumber(tk.number)}</span> · {s.categories[tk.category]} · {formatDateTime(tk.createdAt)}
                    {forSupport && ` · ${tk.requester.name}`}
                    {forSupport && ` · ${tk.assignee?.name ?? s.unassigned}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {tk.priority !== "NORMAL" && <PriorityBadge priority={tk.priority} />}
                  <TicketStatusBadge status={tk.status} forSupport={forSupport} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
