import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { formatCircularNumber, getCircularForUser } from "@/lib/circulars";
import { formatDate } from "@/lib/format";
import { PrintButton } from "@/components/print-button";
import { PrintDoc } from "@/components/print-doc";
import { t } from "@/i18n";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ auto?: string }> };
const c = t.circulars;
const hijri = new Intl.DateTimeFormat("ar-SA-u-nu-latn-ca-islamic-umalqura", { dateStyle: "long", timeZone: "Asia/Riyadh" });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await requireUser();
  const view = await getCircularForUser((await params).id, user);
  return view ? { title: `${c.number(formatCircularNumber(view.circular.year, view.circular.seq))} - ${view.circular.title}` } : {};
}

export default async function PrintCircularPage({ params, searchParams }: Props) {
  const user = await requireUser();
  if (user.mustChangePassword) redirect("/change-password");
  const view = await getCircularForUser((await params).id, user);
  if (!view) notFound();
  const { circular: cr } = view;
  const target =
    cr.audience === "ALL" ? c.audiences.ALL :
    cr.audience === "DEPARTMENTS" ? cr.departments.map((d) => d.department.name).join("، ") :
    c.audiences.PEOPLE;

  return (
    <div className="min-h-screen bg-background py-6 print:bg-white print:py-0">
      <PrintButton auto={(await searchParams).auto === "1"} />
      <PrintDoc number={formatCircularNumber(cr.year, cr.seq)} date={`${hijri.format(cr.createdAt)} — ${formatDate(cr.createdAt)}`}>
        <h1 className="mb-1 text-center text-xl font-bold">{c.number(formatCircularNumber(cr.year, cr.seq))}</h1>
        <p className="mb-6 text-center text-base font-semibold">{cr.title}</p>
        <p className="mb-4"><span className="font-semibold">{c.fields.audience}:</span> {target}</p>
        {cr.important && <p className="mb-4 rounded border border-red-300 bg-red-50 p-2 text-center font-semibold text-red-700">{c.important}</p>}
        <p className="mb-6 whitespace-pre-line text-[14px] leading-8">{cr.body}</p>
        {cr.attachments.length > 0 && (
          <p className="mb-6 text-neutral-600">{t.meetings.fields.attachmentsTitle}: {cr.attachments.map((a) => a.file.name).join("، ")}</p>
        )}
        <div className="ms-auto mt-6 w-64 text-center">
          <p className="font-semibold">{cr.issuer.name}</p>
          {cr.issuer.jobTitle && <p className="text-neutral-600">{cr.issuer.jobTitle}</p>}
          <div className="mx-auto mt-10 w-40 border-b border-neutral-400" />
        </div>
      </PrintDoc>
    </div>
  );
}
