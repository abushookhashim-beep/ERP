import { formatDateTime } from "@/lib/format";
import { t } from "@/i18n";

/** ورقة A4 بترويسة الشركة، مشتركة بين وثائق الطباعة. */
export function PrintDoc({ number, date, children }: { number: string; date: string; children: React.ReactNode }) {
  return (
    <article className="print-doc mx-auto flex min-h-[297mm] max-w-[210mm] flex-col bg-white p-[16mm] text-[13px] leading-6 text-neutral-900 shadow-sm print:min-h-0 print:p-0 print:shadow-none">
      <header className="mb-6 flex items-start justify-between border-b-2 border-[#1f8f3a] pb-4">
        <div>
          <p className="text-xl font-bold text-[#1f8f3a]">{t.appName}</p>
          <p className="text-xs text-neutral-500">{t.appTagline}</p>
        </div>
        <div className="text-end text-xs text-neutral-600">
          <p dir="ltr" className="font-semibold">{number}</p>
          <p>{date}</p>
        </div>
      </header>
      {children}
      <footer className="mt-auto flex justify-between border-t border-neutral-300 pt-3 text-[10px] text-neutral-500">
        <span>{t.requests.doc.footer} — {t.appName}</span>
        <span>{t.requests.doc.printedAt}: {formatDateTime(new Date())}</span>
      </footer>
    </article>
  );
}
