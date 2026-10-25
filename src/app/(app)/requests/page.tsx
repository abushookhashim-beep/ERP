import Link from "next/link";
import { Plus, Send } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ALL_REQUESTS_ROLES, PLEDGE_SENDER_ROLES } from "@/lib/requests";
import { RequestTable } from "@/components/requests/request-table";
import { t } from "@/i18n";

type Tab = "mine" | "sent" | "all";

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUser();
  const canSend = PLEDGE_SENDER_ROLES.includes(user.role);
  const canSeeAll = ALL_REQUESTS_ROLES.includes(user.role);

  const tabs: { key: Tab; label: string }[] = [
    { key: "mine", label: t.requests.myRequests },
    ...(canSend ? [{ key: "sent" as const, label: t.requests.sent }] : []),
    ...(canSeeAll ? [{ key: "all" as const, label: t.requests.allRequests }] : []),
  ];
  const requested = (await searchParams).tab as Tab;
  const tab = tabs.some((x) => x.key === requested) ? requested : "mine";

  const where: Prisma.RequestWhereInput =
    tab === "sent" ? { createdById: user.id, type: "PLEDGE" } :
    tab === "all" ? {} :
    { subjectId: user.id };

  const rows = await db.request.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { subject: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t.requests.title}</h1>
        <div className="flex gap-2">
          {canSend && (
            <Link href="/requests/new/pledge" className="btn-ghost"><Send size={16} />{t.requests.newPledge}</Link>
          )}
          <Link href="/requests/new" className="btn"><Plus size={16} />{t.requests.new}</Link>
        </div>
      </div>

      {tabs.length > 1 && (
        <nav className="flex gap-1 border-b border-border">
          {tabs.map((x) => (
            <Link key={x.key} href={`/requests?tab=${x.key}`}
              className={`-mb-px border-b-2 px-4 py-2 text-sm ${tab === x.key ? "border-brand font-semibold text-brand" : "border-transparent text-muted hover:text-foreground"}`}>
              {x.label}
            </Link>
          ))}
        </nav>
      )}

      <RequestTable rows={rows} showSubject={tab !== "mine"} />
    </div>
  );
}
