import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import { actionableStepsWhere, formatRequestNumber } from "@/lib/requests";
import { t } from "@/i18n";

export default async function ApprovalsPage() {
  const user = await requireUser();
  const steps = await db.approvalStep.findMany({
    where: actionableStepsWhere(user),
    orderBy: { request: { createdAt: "asc" } },
    include: {
      request: {
        include: { subject: { select: { name: true, department: { select: { name: true } } } } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t.approvals.title}</h1>
      {steps.length === 0 ? (
        <p className="card py-12 text-center text-sm text-muted">{t.approvals.empty}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {steps.map(({ id, kind, request: r }) => (
            <li key={id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{t.requests.subtypes[r.subtype as keyof typeof t.requests.subtypes]}</p>
                  <p className="text-sm text-muted">{r.subject.name} · {r.subject.department?.name ?? t.common.none}</p>
                </div>
                <span className="text-xs text-muted" dir="ltr">{formatRequestNumber(r.number)}</span>
              </div>
              <p className="text-sm">
                {r.startDate && r.endDate
                  ? `${formatDate(r.startDate)} ← ${formatDate(r.endDate)} (${r.days} ${t.requests.daysUnit})`
                  : formatDateTime(r.createdAt)}
              </p>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs">{t.requests.approverKinds[kind]}</span>
                <Link href={`/requests/${r.id}`} className="btn text-xs">{t.approvals.view}</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
