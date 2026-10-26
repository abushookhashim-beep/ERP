import { FileText } from "lucide-react";
import type { DocumentType } from "@prisma/client";
import { daysUntil } from "@/lib/hr";
import { formatDate } from "@/lib/format";
import { t } from "@/i18n";

export type DocumentRow = {
  id: string; type: DocumentType; number: string | null; issueDate: Date | null; expiryDate: Date | null; fileId: string | null;
};

/** جدول المستندات مع تلوين تاريخ الانتهاء. actions يعرض أزرار إضافية لكل صف (مثل الحذف). */
export function DocumentsTable({ docs, alertDays, actions }: {
  docs: DocumentRow[]; alertDays: number; actions?: (id: string) => React.ReactNode;
}) {
  const d = t.hr.documents;
  if (docs.length === 0) return <p className="py-4 text-center text-sm text-muted">{d.empty}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-muted">
          <tr>
            {[d.type, d.number, d.issueDate, d.expiryDate, "", ""].map((h, i) => (
              <th key={i} className="whitespace-nowrap p-2 text-start font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {docs.map((doc) => {
            const left = doc.expiryDate ? daysUntil(doc.expiryDate) : null;
            const tone = left === null ? "" : left < 0 ? "text-danger font-medium" : left <= alertDays ? "text-accent font-medium" : "";
            return (
              <tr key={doc.id} className="border-b border-border last:border-0">
                <td className="p-2 font-medium">{d.types[doc.type]}</td>
                <td className="p-2" dir="ltr">{doc.number ?? t.common.none}</td>
                <td className="whitespace-nowrap p-2">{doc.issueDate ? formatDate(doc.issueDate) : t.common.none}</td>
                <td className={`whitespace-nowrap p-2 ${tone}`}>
                  {doc.expiryDate ? formatDate(doc.expiryDate) : t.common.none}
                  {left !== null && left <= alertDays && (
                    <span className="ms-1 text-xs">({left < 0 ? t.hr.expired : t.hr.inDays(left)})</span>
                  )}
                </td>
                <td className="p-2">
                  {doc.fileId
                    ? <a href={`/api/files/${doc.fileId}`} target="_blank" className="inline-flex items-center gap-1 text-brand"><FileText size={14} />{d.view}</a>
                    : <span className="text-xs text-muted">{d.noFile}</span>}
                </td>
                <td className="p-2 text-end">{actions?.(doc.id)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
