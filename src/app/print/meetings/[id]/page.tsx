import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import { getMeetingForUser } from "@/lib/meetings";
import { formatDay, formatTimeRange } from "@/components/meetings/meeting-card";
import { PrintButton } from "@/components/print-button";
import { t } from "@/i18n";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ auto?: string }> };
const m = t.meetings;
const number = (n: number) => `MTG-${String(n).padStart(5, "0")}`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await requireUser();
  const view = await getMeetingForUser((await params).id, user.id);
  return view ? { title: `${number(view.meeting.number)} - ${m.minutes.docTitle} - ${view.meeting.title}` } : {};
}

export default async function PrintMinutesPage({ params, searchParams }: Props) {
  const user = await requireUser();
  if (user.mustChangePassword) redirect("/change-password");
  const view = await getMeetingForUser((await params).id, user.id);
  if (!view || view.meeting.status !== "COMPLETED") notFound();
  const { meeting: mt } = view;
  const present = [mt.organizer.name, ...mt.attendees.filter((a) => a.attended).map((a) => a.user.name)];
  const absent = mt.attendees.filter((a) => !a.attended).map((a) => a.user.name);
  const agenda = mt.agenda?.split("\n").map((l) => l.trim()).filter(Boolean) ?? [];
  const cell = "border border-neutral-300 p-2";

  return (
    <div className="min-h-screen bg-background py-6 print:bg-white print:py-0">
      <PrintButton auto={(await searchParams).auto === "1"} />
      <article className="print-doc mx-auto flex min-h-[297mm] max-w-[210mm] flex-col bg-white p-[16mm] text-[13px] leading-6 text-neutral-900 shadow-sm print:min-h-0 print:p-0 print:shadow-none">
        <header className="mb-6 flex items-start justify-between border-b-2 border-[#1f8f3a] pb-4">
          <div>
            <p className="text-xl font-bold text-[#1f8f3a]">{t.appName}</p>
            <p className="text-xs text-neutral-500">{t.appTagline}</p>
          </div>
          <div className="text-end text-xs text-neutral-600">
            <p dir="ltr" className="font-semibold">{number(mt.number)}</p>
            <p>{formatDate(mt.startsAt)}</p>
          </div>
        </header>

        <h1 className="mb-1 text-center text-xl font-bold">{m.minutes.docTitle}</h1>
        <p className="mb-6 text-center text-base">{mt.title}</p>

        <table className="mb-6 w-full border-collapse">
          <tbody>
            <tr>
              <th className={`${cell} w-[18%] bg-neutral-50 text-start font-medium`}>{m.fields.when}</th>
              <td className={cell}>{formatDay(mt.startsAt)} · {formatTimeRange(mt.startsAt, mt.endsAt)}</td>
              <th className={`${cell} w-[18%] bg-neutral-50 text-start font-medium`}>{m.fields.where}</th>
              <td className={cell}>{[mt.room?.name, mt.onlineUrl && "Microsoft Teams"].filter(Boolean).join(" + ")}</td>
            </tr>
            <tr>
              <th className={`${cell} bg-neutral-50 text-start font-medium`}>{m.fields.organizer}</th>
              <td className={cell}>{mt.organizer.name}</td>
              <th className={`${cell} bg-neutral-50 text-start font-medium`}>{m.fields.secretaryLabel}</th>
              <td className={cell}>{mt.secretary?.name ?? t.common.none}</td>
            </tr>
          </tbody>
        </table>

        <Section title={m.minutes.attendees}>
          <p>{present.join("، ")}</p>
          {absent.length > 0 && <p className="mt-1 text-neutral-600">{m.minutes.absentees}: {absent.join("، ")}</p>}
        </Section>

        {agenda.length > 0 && (
          <Section title={m.fields.agenda}>
            <ol className="list-inside list-decimal">{agenda.map((a, i) => <li key={i}>{a}</li>)}</ol>
          </Section>
        )}

        {mt.minutes && (
          <Section title={m.minutes.discussion}>
            <p className="whitespace-pre-line leading-7">{mt.minutes}</p>
          </Section>
        )}

        <Section title={m.minutes.decisions}>
          {mt.tasks.length === 0 ? <p className="text-neutral-500">{m.minutes.noTasks}</p> : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-100">
                  <th className={`${cell} w-8`}>م</th>
                  <th className={`${cell} text-start`}>{m.minutes.decision}</th>
                  <th className={`${cell} text-start`}>{m.minutes.assignee}</th>
                  <th className={`${cell} text-start`}>{m.minutes.due}</th>
                </tr>
              </thead>
              <tbody>
                {mt.tasks.map((task, i) => (
                  <tr key={task.id}>
                    <td className={`${cell} text-center`}>{i + 1}</td>
                    <td className={cell}>{task.title}</td>
                    <td className={cell}>{task.assignee.name}</td>
                    <td className={cell}>{task.dueDate ? formatDate(task.dueDate) : t.common.none}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <div className="mt-6 grid grid-cols-2 gap-10 text-center">
          {[[m.fields.secretaryLabel, mt.secretary?.name ?? ""], [m.fields.organizer, mt.organizer.name]].map(([label, name]) => (
            <div key={label}>
              <p className="font-semibold">{label}</p>
              <p className="text-neutral-600">{name}</p>
              <div className="mx-auto mt-10 w-40 border-b border-neutral-400" />
            </div>
          ))}
        </div>

        <footer className="mt-auto flex justify-between border-t border-neutral-300 pt-3 text-[10px] text-neutral-500">
          <span>{mt.minutesApprovedAt && m.minutes.approvedAt(formatDateTime(mt.minutesApprovedAt))} — {t.appName}</span>
          <span>{t.requests.doc.printedAt}: {formatDateTime(new Date())}</span>
        </footer>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className="mb-2 border-s-4 border-[#1f8f3a] ps-2 text-sm font-bold">{title}</h2>
      {children}
    </section>
  );
}
