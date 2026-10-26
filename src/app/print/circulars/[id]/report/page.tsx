import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { formatCircularNumber, getCircularForUser } from "@/lib/circulars";
import { formatDate, formatDateTime } from "@/lib/format";
import { PrintButton } from "@/components/print-button";
import { PrintDoc } from "@/components/print-doc";
import { t } from "@/i18n";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ auto?: string }> };
const c = t.circulars;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await requireUser();
  const view = await getCircularForUser((await params).id, user);
  return view ? { title: `${c.reportTitle} ${formatCircularNumber(view.circular.year, view.circular.seq)}` } : {};
}

export default async function CircularReportPage({ params, searchParams }: Props) {
  const user = await requireUser();
  if (user.mustChangePassword) redirect("/change-password");
  const view = await getCircularForUser((await params).id, user);
  if (!view?.canTrack) notFound();
  const { circular: cr } = view;
  const done = cr.recipients.filter((r) => (cr.important ? r.acknowledgedAt : r.readAt)).length;
  const cell = "border border-neutral-300 p-1.5";

  return (
    <div className="min-h-screen bg-background py-6 print:bg-white print:py-0">
      <PrintButton auto={(await searchParams).auto === "1"} />
      <PrintDoc number={formatCircularNumber(cr.year, cr.seq)} date={formatDate(new Date())}>
        <h1 className="mb-1 text-center text-xl font-bold">{c.reportTitle}</h1>
        <p className="mb-2 text-center">{c.number(formatCircularNumber(cr.year, cr.seq))} — {cr.title}</p>
        <p className="mb-6 text-center text-neutral-600">
          {cr.important ? c.tracking.acknowledged : c.tracking.read}: {c.tracking.of(done, cr.recipients.length)}
          {cr.recipients.length > 0 && ` (${Math.round((done / cr.recipients.length) * 100)}%)`}
        </p>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-neutral-100">
              <th className={`${cell} w-8`}>م</th>
              <th className={`${cell} text-start`}>{t.users.name}</th>
              <th className={`${cell} text-start`}>{t.users.department}</th>
              <th className={`${cell} text-start`}>{c.tracking.read}</th>
              {cr.important && <th className={`${cell} text-start`}>{c.tracking.acknowledged}</th>}
            </tr>
          </thead>
          <tbody>
            {cr.recipients.map((r, i) => (
              <tr key={r.userId} className="break-inside-avoid">
                <td className={`${cell} text-center`}>{i + 1}</td>
                <td className={cell}>{r.user.name}</td>
                <td className={cell}>{r.user.department?.name ?? t.common.none}</td>
                <td className={cell}>{r.readAt ? formatDateTime(r.readAt) : <span className="text-red-700">{c.tracking.pending}</span>}</td>
                {cr.important && (
                  <td className={cell}>{r.acknowledgedAt ? formatDateTime(r.acknowledgedAt) : <span className="text-red-700">{c.tracking.pendingAck}</span>}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </PrintDoc>
    </div>
  );
}
