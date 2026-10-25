import Link from "next/link";
import type { RequestStatus, RequestType } from "@prisma/client";
import { formatDate, formatDateTime } from "@/lib/format";
import { formatRequestNumber } from "@/lib/requests";
import { t } from "@/i18n";
import { StatusBadge } from "./status-badge";

export type RequestRow = {
  id: string;
  number: number;
  type: RequestType;
  subtype: string;
  status: RequestStatus;
  startDate: Date | null;
  endDate: Date | null;
  days: number | null;
  createdAt: Date;
  subject: { name: string };
};

export function RequestTable({ rows, showSubject }: { rows: RequestRow[]; showSubject?: boolean }) {
  if (rows.length === 0) return <p className="card py-12 text-center text-sm text-muted">{t.requests.empty}</p>;

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-muted">
          <tr>
            {[t.requests.fields.number, ...(showSubject ? [t.requests.fields.subject] : []), t.requests.fields.type,
              t.requests.fields.startDate, t.requests.fields.createdAt, t.requests.fields.status].map((h) => (
              <th key={h} className="whitespace-nowrap p-3 text-start font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border last:border-0 hover:bg-brand-soft/40">
              <td className="p-3" dir="ltr">
                <Link href={`/requests/${r.id}`} className="font-medium text-brand">{formatRequestNumber(r.number)}</Link>
              </td>
              {showSubject && <td className="p-3">{r.subject.name}</td>}
              <td className="p-3">{t.requests.subtypes[r.subtype as keyof typeof t.requests.subtypes]}</td>
              <td className="whitespace-nowrap p-3">
                {r.startDate && r.endDate
                  ? `${formatDate(r.startDate)} ← ${formatDate(r.endDate)} (${r.days} ${t.requests.daysUnit})`
                  : t.common.none}
              </td>
              <td className="whitespace-nowrap p-3 text-muted">{formatDateTime(r.createdAt)}</td>
              <td className="p-3"><StatusBadge status={r.status} type={r.type} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
