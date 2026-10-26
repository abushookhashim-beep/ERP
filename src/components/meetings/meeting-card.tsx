import Link from "next/link";
import { MapPin, Video } from "lucide-react";
import type { InviteResponse, MeetingMode, MeetingStatus } from "@prisma/client";
import { t } from "@/i18n";

const time = new Intl.DateTimeFormat("ar-SA-u-nu-latn", { timeStyle: "short", timeZone: "Asia/Riyadh" });
const day = new Intl.DateTimeFormat("ar-SA-u-nu-latn-ca-gregory", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Riyadh" });

export type MeetingSummary = {
  id: string; title: string; startsAt: Date; endsAt: Date; mode: MeetingMode; status: MeetingStatus;
  room: { name: string } | null; organizer: { name: string }; myResponse?: InviteResponse | null;
};

export const formatTimeRange = (s: Date, e: Date) => `${time.format(s)} – ${time.format(e)}`;
export const formatDay = (d: Date) => day.format(d);

export function MeetingCard({ meeting: mt, showDay = true }: { meeting: MeetingSummary; showDay?: boolean }) {
  return (
    <Link href={`/meetings/${mt.id}`} className="card flex flex-col gap-2 transition hover:border-brand">
      <div className="flex items-start justify-between gap-3">
        <p className={`font-semibold ${mt.status === "CANCELLED" ? "text-muted line-through" : ""}`}>{mt.title}</p>
        {mt.status !== "SCHEDULED" ? (
          <span className="whitespace-nowrap rounded-full bg-border px-2 py-0.5 text-xs">{t.meetings.status[mt.status]}</span>
        ) : mt.myResponse === "PENDING" ? (
          <span className="whitespace-nowrap rounded-full bg-accent px-2 py-0.5 text-xs text-white">{t.meetings.responses.PENDING}</span>
        ) : null}
      </div>
      <p className="text-sm">{showDay && `${formatDay(mt.startsAt)} · `}{formatTimeRange(mt.startsAt, mt.endsAt)}</p>
      <p className="flex items-center gap-1 text-xs text-muted">
        {mt.mode === "ONLINE" ? <Video size={14} /> : <MapPin size={14} />}
        {mt.room?.name ?? t.meetings.modes.ONLINE}
        {mt.mode === "HYBRID" && ` + ${t.meetings.modes.ONLINE}`}
        <span> · {t.meetings.fields.organizer}: {mt.organizer.name}</span>
      </p>
    </Link>
  );
}
