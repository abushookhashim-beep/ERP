import Link from "next/link";
import { Paperclip, Plus, Search } from "lucide-react";
import type { CircularCategory, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { activeWhere, canPublish, formatCircularNumber, getPublishScope, visibleWhere } from "@/lib/circulars";
import { formatDate } from "@/lib/format";
import { todayDate } from "@/lib/hr";
import { t } from "@/i18n";

type Tab = "current" | "archive" | "issued";
const c = t.circulars;
type Search = { tab?: string; q?: string; category?: string; year?: string };

export default async function CircularsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const publisher = canPublish(await getPublishScope(user));
  const tabs: { key: Tab; label: string }[] = [
    { key: "current", label: c.current },
    { key: "archive", label: c.archive },
    ...(publisher ? [{ key: "issued" as const, label: c.issued }] : []),
  ];
  const tab = tabs.some((x) => x.key === sp.tab) ? (sp.tab as Tab) : "current";

  const filters: Prisma.CircularWhereInput[] = [visibleWhere(user)];
  if (tab === "current") filters.push(activeWhere());
  if (tab === "issued") filters.push({ issuerId: user.id });
  if (tab === "archive") {
    const q = sp.q?.trim();
    const num = q?.match(/^(\d{4})\/(\d{1,3})$/);
    if (num) filters.push({ year: Number(num[1]), seq: Number(num[2]) });
    else if (q) filters.push({ title: { contains: q, mode: "insensitive" } });
    if (sp.category && sp.category in c.categories) filters.push({ category: sp.category as CircularCategory });
    if (sp.year && /^\d{4}$/.test(sp.year)) filters.push({ year: Number(sp.year) });
  }

  const [rows, years] = await Promise.all([
    db.circular.findMany({
      where: { AND: filters },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        issuer: { select: { name: true } },
        recipients: { where: { userId: user.id }, select: { readAt: true, acknowledgedAt: true, remindedAt: true } },
        _count: { select: { attachments: true, recipients: true } },
      },
    }),
    tab === "archive" ? db.circular.findMany({ distinct: ["year"], select: { year: true }, orderBy: { year: "desc" } }) : [],
  ]);

  // نسب الاطلاع للتعاميم الصادرة مني
  const readCounts = tab === "issued"
    ? new Map((await db.circularRecipient.groupBy({
        by: ["circularId"],
        where: { circularId: { in: rows.map((r) => r.id) }, readAt: { not: null } },
        _count: true,
      })).map((g) => [g.circularId, g._count]))
    : new Map<string, number>();

  // في الحالية: غير المقروء أولاً، ثم الهام
  const readRank = (r: (typeof rows)[number]) => (r.recipients[0] && !r.recipients[0].readAt ? 0 : 1);
  const circulars = tab === "current"
    ? [...rows].sort((a, b) => readRank(a) - readRank(b) || Number(b.important) - Number(a.important))
    : rows;
  const today = todayDate();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{c.title}</h1>
        {publisher && <Link href="/circulars/new" className="btn"><Plus size={16} />{c.new}</Link>}
      </div>
      <nav className="flex gap-1 border-b border-border">
        {tabs.map((x) => (
          <Link key={x.key} href={`/circulars?tab=${x.key}`}
            className={`-mb-px border-b-2 px-4 py-2 text-sm ${tab === x.key ? "border-brand font-semibold text-brand" : "border-transparent text-muted"}`}>
            {x.label}
          </Link>
        ))}
      </nav>

      {tab === "archive" && (
        <form className="flex flex-wrap gap-2">
          <input type="hidden" name="tab" value="archive" />
          <div className="relative min-w-60 flex-1">
            <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={sp.q} placeholder={c.search} className="input ps-9" />
          </div>
          <select name="category" defaultValue={sp.category ?? ""} className="input w-auto">
            <option value="">{c.allCategories}</option>
            {(Object.keys(c.categories) as CircularCategory[]).map((k) => <option key={k} value={k}>{c.categories[k]}</option>)}
          </select>
          <select name="year" defaultValue={sp.year ?? ""} className="input w-auto">
            <option value="">{c.allYears}</option>
            {years.map((y) => <option key={y.year} value={y.year}>{y.year}</option>)}
          </select>
          <button className="btn">{t.common.search}</button>
        </form>
      )}

      {circulars.length === 0 ? (
        <p className="card py-12 text-center text-sm text-muted">{c.empty}</p>
      ) : (
        <ul className="space-y-3">
          {circulars.map((cr) => {
            const mine = cr.recipients[0];
            const unread = mine && !mine.readAt;
            const expired = cr.expiresAt && cr.expiresAt < today;
            const read = readCounts.get(cr.id) ?? 0;
            return (
              <li key={cr.id}>
                <Link href={`/circulars/${cr.id}`}
                  className={`card flex flex-wrap items-start justify-between gap-3 transition hover:border-brand ${unread ? "border-s-4 border-s-brand" : ""} ${cr.important && unread ? "bg-accent/5" : ""}`}>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={unread ? "font-bold" : "font-medium"}>{cr.title}</p>
                      {cr.important && <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger">{c.important}</span>}
                      {unread && <span className="rounded-full bg-brand px-2 py-0.5 text-xs text-white">{mine.remindedAt ? c.reminder : c.unread}</span>}
                      {expired && <span className="rounded-full bg-border px-2 py-0.5 text-xs text-muted">{c.expired}</span>}
                      {cr._count.attachments > 0 && <Paperclip size={14} className="text-muted" />}
                    </div>
                    <p className="text-xs text-muted">
                      {c.number(formatCircularNumber(cr.year, cr.seq))} · {c.categories[cr.category]} · {cr.issuer.name} · {formatDate(cr.createdAt)}
                    </p>
                  </div>
                  {tab === "issued" && (
                    <span className="text-sm text-muted">{c.tracking.read}: {c.tracking.of(read, cr._count.recipients)}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
