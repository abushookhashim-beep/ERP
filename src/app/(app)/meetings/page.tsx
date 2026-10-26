import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { participatesWhere, riyadhDay } from "@/lib/meetings";
import { MeetingCard, type MeetingSummary } from "@/components/meetings/meeting-card";
import { t } from "@/i18n";

type Tab = "upcoming" | "past" | "calendar";
const WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const monthTitle = new Intl.DateTimeFormat("ar-SA-u-nu-latn-ca-gregory", { month: "long", year: "numeric", timeZone: "UTC" });

export default async function MeetingsPage({ searchParams }: { searchParams: Promise<{ tab?: string; month?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const tab: Tab = sp.tab === "past" || sp.tab === "calendar" ? sp.tab : "upcoming";
  const now = new Date();

  const select = {
    id: true, title: true, startsAt: true, endsAt: true, mode: true, status: true,
    room: { select: { name: true } }, organizer: { select: { name: true } },
    attendees: { where: { userId: user.id }, select: { response: true } },
  } as const;
  const toSummary = ({ attendees, ...mt }: { attendees: { response: MeetingSummary["myResponse"] }[] } & Omit<MeetingSummary, "myResponse">) =>
    ({ ...mt, myResponse: attendees[0]?.response ?? null });

  // نطاق الشهر في التقويم
  const month = /^\d{4}-\d{2}$/.test(sp.month ?? "") ? sp.month! : riyadhDay(now).slice(0, 7);
  const [y, mo] = month.split("-").map(Number);
  const monthStart = new Date(`${month}-01T00:00:00+03:00`);
  const monthEnd = new Date(Date.UTC(y, mo, 1) - 3 * 3_600_000);

  const meetings = (await db.meeting.findMany({
    where: {
      ...participatesWhere(user.id),
      ...(tab === "upcoming" ? { endsAt: { gte: now }, status: { not: "CANCELLED" } } :
          tab === "past" ? { endsAt: { lt: now } } :
          { startsAt: { gte: monthStart, lt: monthEnd } }),
    },
    orderBy: { startsAt: tab === "past" ? "desc" : "asc" },
    take: 200,
    select,
  })).map(toSummary);

  const tabs: { key: Tab; label: string }[] = [
    { key: "upcoming", label: t.meetings.upcoming },
    { key: "past", label: t.meetings.past },
    { key: "calendar", label: t.meetings.calendar },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t.meetings.title}</h1>
        <Link href="/meetings/new" className="btn"><Plus size={16} />{t.meetings.new}</Link>
      </div>
      <nav className="flex gap-1 border-b border-border">
        {tabs.map((x) => (
          <Link key={x.key} href={`/meetings?tab=${x.key}`}
            className={`-mb-px border-b-2 px-4 py-2 text-sm ${tab === x.key ? "border-brand font-semibold text-brand" : "border-transparent text-muted hover:text-foreground"}`}>
            {x.label}
          </Link>
        ))}
      </nav>

      {tab === "calendar" ? (
        <Calendar month={month} year={y} monthIndex={mo - 1} meetings={meetings} today={riyadhDay(now)} />
      ) : meetings.length === 0 ? (
        <p className="card py-12 text-center text-sm text-muted">{t.meetings.empty}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {meetings.map((mt) => <MeetingCard key={mt.id} meeting={mt} />)}
        </div>
      )}
    </div>
  );
}

function Calendar({ month, year, monthIndex, meetings, today }: {
  month: string; year: number; monthIndex: number; meetings: MeetingSummary[]; today: string;
}) {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array<null>(first.getUTCDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const shift = (n: number) => new Date(Date.UTC(year, monthIndex + n, 1)).toISOString().slice(0, 7);
  const byDay = new Map<string, MeetingSummary[]>();
  for (const mt of meetings) {
    const key = riyadhDay(mt.startsAt);
    byDay.set(key, [...(byDay.get(key) ?? []), mt]);
  }

  return (
    <div className="card p-0">
      <div className="flex items-center justify-between border-b border-border p-3">
        <Link href={`/meetings?tab=calendar&month=${shift(-1)}`} className="btn-ghost" aria-label="previous"><ChevronRight size={16} /></Link>
        <h2 className="font-semibold">{monthTitle.format(first)}</h2>
        <Link href={`/meetings?tab=calendar&month=${shift(1)}`} className="btn-ghost" aria-label="next"><ChevronLeft size={16} /></Link>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-muted">
        {WEEKDAYS.map((d) => <div key={d} className="border-b border-border py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const key = d ? `${month}-${String(d).padStart(2, "0")}` : `e${i}`;
          const items = d ? byDay.get(key) ?? [] : [];
          return (
            <div key={key} className={`min-h-24 border-b border-e border-border p-1 text-xs ${key === today ? "bg-brand-soft" : ""}`}>
              {d && <p className={`mb-1 ${key === today ? "font-bold text-brand" : "text-muted"}`}>{d}</p>}
              {items.map((mt) => (
                <Link key={mt.id} href={`/meetings/${mt.id}`} title={mt.title}
                  className={`mb-1 block truncate rounded px-1 py-0.5 ${mt.status === "CANCELLED" ? "bg-border text-muted line-through" : "bg-brand text-white"}`}>
                  {mt.title}
                </Link>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
