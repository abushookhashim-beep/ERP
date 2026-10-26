import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, FileText, MapPin, Printer, Video } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import { getMeetingForUser } from "@/lib/meetings";
import { formatDay, formatTimeRange } from "@/components/meetings/meeting-card";
import { TaskStatusSelect } from "@/components/meetings/task-status";
import { t } from "@/i18n";
import { CancelMeetingButton } from "./cancel-button";
import { MinutesForm } from "./minutes-form";
import { Rsvp } from "./rsvp";

const m = t.meetings;

export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const view = await getMeetingForUser((await params).id, user.id);
  if (!view) notFound();
  const { meeting: mt, isOrganizer, canWriteMinutes, invite } = view;
  const now = new Date();
  const scheduled = mt.status === "SCHEDULED";
  const agenda = mt.agenda?.split("\n").map((l) => l.trim()).filter(Boolean) ?? [];
  const people = [
    { id: mt.organizer.id, name: mt.organizer.name, accepted: true },
    ...mt.attendees.map((a) => ({ id: a.userId, name: a.user.name, accepted: a.response === "ACCEPTED" })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/meetings" className="text-sm text-brand">← {m.back}</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{mt.title}</h1>
          <span className="rounded-full bg-border px-2 py-0.5 text-xs">{m.status[mt.status]}</span>
          {mt.status === "COMPLETED" && (
            <Link href={`/print/meetings/${mt.id}?auto=1`} target="_blank" className="btn-ghost ms-auto">
              <Printer size={16} />{m.minutes.print}
            </Link>
          )}
        </div>
      </div>

      {mt.status === "CANCELLED" && <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{m.cancelled}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card space-y-3 text-sm">
            <p className="flex items-center gap-2"><CalendarClock size={16} className="text-brand" />
              {formatDay(mt.startsAt)} · {formatTimeRange(mt.startsAt, mt.endsAt)}</p>
            {mt.room && <p className="flex items-center gap-2"><MapPin size={16} className="text-brand" />{mt.room.name}</p>}
            {mt.onlineUrl && (
              <p className="flex items-center gap-2">
                <Video size={16} className="text-brand" />
                {scheduled
                  ? <a href={mt.onlineUrl} target="_blank" rel="noopener noreferrer" className="btn">{m.join}</a>
                  : m.modes.ONLINE}
              </p>
            )}
            <p className="text-muted">
              {m.fields.organizer}: {mt.organizer.name}
              {mt.secretary && ` · ${m.fields.secretaryLabel}: ${mt.secretary.name}`}
            </p>
          </section>

          {agenda.length > 0 && (
            <section className="card">
              <h2 className="mb-3 font-semibold">{m.fields.agenda}</h2>
              <ol className="list-inside list-decimal space-y-1 text-sm">{agenda.map((a, i) => <li key={i}>{a}</li>)}</ol>
            </section>
          )}

          {mt.attachments.length > 0 && (
            <section className="card">
              <h2 className="mb-3 font-semibold">{m.fields.attachmentsTitle}</h2>
              <ul className="space-y-1 text-sm">
                {mt.attachments.map((a) => (
                  <li key={a.id}>
                    <a href={`/api/files/${a.file.id}`} target="_blank" className="inline-flex items-center gap-1 text-brand">
                      <FileText size={14} />{a.file.name}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {invite && scheduled && mt.endsAt > now && <Rsvp meetingId={mt.id} current={invite.response} />}

          {mt.status === "COMPLETED" ? (
            <section className="card space-y-4">
              <div>
                <h2 className="font-semibold">{m.minutes.title}</h2>
                {mt.minutesApprovedAt && <p className="text-xs text-muted">{m.minutes.approvedAt(formatDateTime(mt.minutesApprovedAt))}</p>}
              </div>
              {mt.minutes && <p className="whitespace-pre-line text-sm leading-7">{mt.minutes}</p>}
              {mt.tasks.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold">{m.minutes.decisions}</h3>
                  <ul className="divide-y divide-border text-sm">
                    {mt.tasks.map((task) => (
                      <li key={task.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                        <span>
                          <span className="font-medium">{task.title}</span>
                          <span className="text-muted"> · {task.assignee.name}{task.dueDate && ` · ${formatDate(task.dueDate)}`}</span>
                        </span>
                        <TaskStatusSelect taskId={task.id} status={task.status}
                          editable={task.assigneeId === user.id || task.createdById === user.id || isOrganizer} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ) : scheduled && canWriteMinutes ? (
            mt.startsAt <= now
              ? <MinutesForm meetingId={mt.id} people={people} />
              : <p className="card text-sm text-muted">{m.minutes.tooEarly}</p>
          ) : null}

          {isOrganizer && scheduled && <CancelMeetingButton meetingId={mt.id} />}
        </div>

        <aside className="card h-fit">
          <h2 className="mb-3 font-semibold">{m.fields.invitees} ({mt.attendees.length})</h2>
          <ul className="space-y-2 text-sm">
            {mt.attendees.map((a) => {
              const label = mt.status === "COMPLETED" && a.attended !== null
                ? (a.attended ? m.minutes.attended : m.minutes.absent)
                : m.responses[a.response];
              const tone = a.attended || a.response === "ACCEPTED" ? "text-brand" :
                a.attended === false || a.response === "DECLINED" ? "text-danger" : "text-muted";
              return (
                <li key={a.userId} className="flex items-start justify-between gap-2">
                  <span>
                    <span className="block">{a.user.name}</span>
                    {a.responseNote && <span className="block text-xs text-muted">{a.responseNote}</span>}
                  </span>
                  <span className={`whitespace-nowrap text-xs ${tone}`}>{label}</span>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </div>
  );
}
