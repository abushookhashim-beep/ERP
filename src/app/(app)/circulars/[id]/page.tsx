import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Printer } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatCircularNumber, getCircularForUser } from "@/lib/circulars";
import { formatDate, formatDateTime } from "@/lib/format";
import { todayDate } from "@/lib/hr";
import { t } from "@/i18n";
import { AcknowledgeButton, RemindButton } from "./buttons";

const c = t.circulars;

export default async function CircularPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const view = await getCircularForUser((await params).id, user);
  if (!view) notFound();
  const { circular: cr, mine, canTrack } = view;

  // فتح التعميم يسجل الاطلاع
  let readAt = mine?.readAt ?? null;
  if (mine && !readAt) {
    readAt = new Date();
    await db.circularRecipient.update({ where: { circularId_userId: { circularId: cr.id, userId: user.id } }, data: { readAt } });
  }

  const target =
    cr.audience === "ALL" ? c.audiences.ALL :
    cr.audience === "DEPARTMENTS" ? cr.departments.map((d) => d.department.name).join("، ") :
    c.audiences.PEOPLE;
  const total = cr.recipients.length;
  // سجل المستخدم الحالي محدّث للتو، فنحسبه من القيمة الجديدة
  const isRead = (r: (typeof cr.recipients)[number]) => (r.userId === user.id ? readAt : r.readAt);
  const done = cr.recipients.filter((r) => (cr.important ? r.acknowledgedAt : isRead(r))).length;
  const pending = cr.recipients.filter((r) => !(cr.important ? r.acknowledgedAt : isRead(r)));
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/circulars" className="text-sm text-brand">← {c.back}</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{cr.title}</h1>
          {cr.important && <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs text-danger">{c.important}</span>}
          {cr.expiresAt && cr.expiresAt < todayDate() && <span className="rounded-full bg-border px-2 py-0.5 text-xs text-muted">{c.expired}</span>}
          <Link href={`/print/circulars/${cr.id}?auto=1`} target="_blank" className="btn-ghost ms-auto"><Printer size={16} />{c.print}</Link>
        </div>
        <p className="mt-1 text-sm text-muted">
          {c.number(formatCircularNumber(cr.year, cr.seq))} · {c.categories[cr.category]} · {formatDate(cr.createdAt)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <article className="card">
            <p className="whitespace-pre-line leading-8">{cr.body}</p>
            {cr.attachments.length > 0 && (
              <ul className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
                {cr.attachments.map((a) => (
                  <li key={a.id}>
                    <a href={`/api/files/${a.file.id}`} target="_blank" className="inline-flex items-center gap-1 text-brand">
                      <FileText size={14} />{a.file.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </article>

          {mine && cr.important && (
            mine.acknowledgedAt
              ? <p className="rounded-lg bg-brand-soft p-3 text-sm text-brand">{c.acknowledgedAt(formatDateTime(mine.acknowledgedAt))}</p>
              : <div className="card border-brand"><AcknowledgeButton circularId={cr.id} /></div>
          )}
        </div>

        <aside className="space-y-6">
          <section className="card">
            <dl className="space-y-3 text-sm">
              <div><dt className="text-muted">{c.fields.issuer}</dt><dd className="font-medium">{cr.issuer.name}{cr.issuer.jobTitle && ` — ${cr.issuer.jobTitle}`}</dd></div>
              <div><dt className="text-muted">{c.fields.audience}</dt><dd className="font-medium">{target}</dd></div>
              {cr.expiresAt && <div><dt className="text-muted">{c.fields.expiresLabel}</dt><dd className="font-medium">{formatDate(cr.expiresAt)}</dd></div>}
            </dl>
          </section>

          {canTrack && (
            <section className="card space-y-4">
              <h2 className="font-semibold">{c.tracking.title}</h2>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{cr.important ? c.tracking.acknowledged : c.tracking.read}</span>
                  <span className="tabular-nums">{c.tracking.of(done, total)} ({pct}%)</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-brand-soft">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                </div>
              </div>
              {pending.length === 0 ? (
                <p className="text-sm text-brand">{c.tracking.allDone}</p>
              ) : (
                <>
                  <div>
                    <p className="mb-2 text-xs text-muted">{cr.important ? c.tracking.pendingAck : c.tracking.pending} ({pending.length})</p>
                    <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
                      {pending.map((r) => (
                        <li key={r.userId}>{r.user.name}<span className="text-xs text-muted">{r.user.department && ` · ${r.user.department.name}`}</span></li>
                      ))}
                    </ul>
                  </div>
                  <RemindButton circularId={cr.id} />
                </>
              )}
              <Link href={`/print/circulars/${cr.id}/report?auto=1`} target="_blank" className="btn-ghost w-full py-2">
                <Printer size={16} />{c.tracking.report}
              </Link>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
