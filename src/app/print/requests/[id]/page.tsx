import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import { getVisibleRequest } from "@/lib/request-view";
import { formatRequestNumber } from "@/lib/requests";
import { t } from "@/i18n";
import { PrintButton } from "./print-button";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ auto?: string }> };

const subtypeLabel = (s: string) => t.requests.subtypes[s as keyof typeof t.requests.subtypes];

// عنوان الصفحة يصبح اسم ملف PDF الافتراضي
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await requireUser();
  const view = await getVisibleRequest((await params).id, user);
  if (!view) return {};
  const { request } = view;
  return { title: `${formatRequestNumber(request.number)} - ${subtypeLabel(request.subtype)} - ${request.subject.name}` };
}

export default async function PrintRequestPage({ params, searchParams }: Props) {
  const user = await requireUser();
  if (user.mustChangePassword) redirect("/change-password");
  const view = await getVisibleRequest((await params).id, user);
  if (!view) notFound();
  const { request, details } = view;
  const { auto } = await searchParams;
  const doc = t.requests.doc;
  const isPledge = request.type === "PLEDGE";
  const ack = isPledge ? request.steps.find((s) => s.kind === "EMPLOYEE") : undefined;
  const statusLabels = isPledge ? t.requests.pledgeStatus : t.requests.status;

  const requestRows: [string, string][] = [
    [t.requests.fields.number, formatRequestNumber(request.number)],
    [t.requests.fields.type, subtypeLabel(request.subtype)],
    [t.requests.fields.createdAt, formatDateTime(request.createdAt)],
    [t.requests.fields.status, statusLabels[request.status]],
  ];
  if (request.createdById !== request.subjectId) requestRows.push([doc.issuedBy, request.createdBy.name]);
  if (request.startDate && request.endDate) {
    requestRows.push(
      [t.requests.fields.startDate, formatDate(request.startDate)],
      [t.requests.fields.endDate, formatDate(request.endDate)],
      [t.requests.fields.days, `${request.days} ${t.requests.daysUnit}`],
    );
  }
  if (details.addressedTo) requestRows.push([t.requests.fields.addressedTo, details.addressedTo]);
  if (details.bankName) requestRows.push([t.requests.fields.bankName, details.bankName]);
  if (details.iban) requestRows.push([t.requests.fields.iban, details.iban]);
  if (request.notes) requestRows.push([t.requests.fields.notes, request.notes]);

  return (
    <div className="min-h-screen bg-background py-6 print:bg-white print:py-0">
      <PrintButton auto={auto === "1"} />

      <article className="print-doc mx-auto flex min-h-[297mm] max-w-[210mm] flex-col bg-white p-[16mm] text-[13px] leading-6 text-neutral-900 shadow-sm print:min-h-0 print:p-0 print:shadow-none">
        <header className="mb-6 flex items-start justify-between border-b-2 border-[#1f8f3a] pb-4">
          <div>
            <p className="text-xl font-bold text-[#1f8f3a]">{t.appName}</p>
            <p className="text-xs text-neutral-500">{t.appTagline}</p>
          </div>
          <div className="text-end text-xs text-neutral-600">
            <p dir="ltr" className="font-semibold">{formatRequestNumber(request.number)}</p>
            <p>{formatDate(request.createdAt)}</p>
          </div>
        </header>

        <h1 className="mb-6 text-center text-xl font-bold">{isPledge ? details.pledgeTitle : subtypeLabel(request.subtype)}</h1>

        <Section title={doc.employeeInfo}>
          <InfoGrid rows={[
            [t.users.name, request.subject.name],
            [t.users.employeeNo, request.subject.employeeNo],
            [t.users.jobTitle, request.subject.jobTitle ?? t.common.none],
            [t.users.department, request.subject.department?.name ?? t.common.none],
          ]} />
        </Section>

        {isPledge ? (
          <>
            <Section title={subtypeLabel(request.subtype)}>
              <p className="mb-2 font-semibold">{doc.pledgeDeclaration(request.subject.name, request.subject.employeeNo)}</p>
              <p className="whitespace-pre-line leading-7">{details.pledgeBody}</p>
            </Section>
            {details.items && (
              <Section title={doc.itemsTable}>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-neutral-100">
                      <th className="w-10 border border-neutral-300 p-2">{doc.itemNo}</th>
                      <th className="border border-neutral-300 p-2 text-start">{doc.item}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.items.map((item, i) => (
                      <tr key={i}>
                        <td className="border border-neutral-300 p-2 text-center">{i + 1}</td>
                        <td className="border border-neutral-300 p-2">{item}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            )}
            <div className={`mb-6 rounded border p-3 text-center font-semibold ${
              ack?.status === "APPROVED" ? "border-[#1f8f3a] bg-[#e8f5eb] text-[#1f8f3a]" :
              ack?.status === "REJECTED" ? "border-red-300 bg-red-50 text-red-700" : "border-neutral-300 text-neutral-600"}`}>
              {ack?.status === "APPROVED" && ack.actedAt ? doc.acknowledgedOn(formatDateTime(ack.actedAt)) :
               ack?.status === "REJECTED" && ack.actedAt ? doc.objectedOn(formatDateTime(ack.actedAt)) :
               doc.awaitingAck}
              {ack?.comment && <p className="mt-1 text-xs font-normal">{ack.comment}</p>}
            </div>
          </>
        ) : (
          <>
            <Section title={doc.requestInfo}>
              <InfoGrid rows={requestRows} />
            </Section>
            <Section title={doc.approvalRecord}>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-100">
                    {[doc.step, doc.name, doc.decision, doc.date, doc.comment].map((h) => (
                      <th key={h} className="border border-neutral-300 p-2 text-start">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {request.steps.map((s) => (
                    <tr key={s.id}>
                      <td className="border border-neutral-300 p-2">{t.requests.approverKinds[s.kind]}</td>
                      <td className="border border-neutral-300 p-2">{s.actedBy?.name ?? s.approver?.name ?? t.common.none}</td>
                      <td className="border border-neutral-300 p-2">{t.requests.stepStatus[s.status]}</td>
                      <td className="border border-neutral-300 p-2">{s.actedAt ? formatDateTime(s.actedAt) : t.common.none}</td>
                      <td className="border border-neutral-300 p-2">{s.comment ?? t.common.none}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </>
        )}

        {isPledge && (
          <div className="mt-6 grid grid-cols-2 gap-10 text-center">
            {[[doc.employeeSignature, request.subject.name], [doc.issuerSignature, request.createdBy.name]].map(([label, name]) => (
              <div key={label}>
                <p className="font-semibold">{label}</p>
                <p className="text-neutral-600">{name}</p>
                <div className="mx-auto mt-10 w-40 border-b border-neutral-400" />
              </div>
            ))}
          </div>
        )}

        <footer className="mt-auto flex justify-between border-t border-neutral-300 pt-3 text-[10px] text-neutral-500">
          <span>{doc.footer} — {t.appName}</span>
          <span>{doc.printedAt}: {formatDateTime(new Date())}</span>
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

function InfoGrid({ rows }: { rows: [string, string][] }) {
  return (
    <table className="w-full border-collapse">
      <tbody>
        {Array.from({ length: Math.ceil(rows.length / 2) }, (_, i) => rows.slice(i * 2, i * 2 + 2)).map((pair, i) => (
          <tr key={i}>
            {pair.map(([label, value]) => (
              <Cell key={label} label={label} value={value} />
            ))}
            {pair.length === 1 && <td colSpan={2} className="border border-neutral-300" />}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <>
      <th className="w-[18%] border border-neutral-300 bg-neutral-50 p-2 text-start font-medium text-neutral-600">{label}</th>
      <td className="w-[32%] border border-neutral-300 p-2">{value}</td>
    </>
  );
}
