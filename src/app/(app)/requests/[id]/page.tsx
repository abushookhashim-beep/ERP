import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, Clock, MinusCircle, XCircle } from "lucide-react";
import type { StepStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import { ALL_REQUESTS_ROLES, canActOnStep, formatRequestNumber } from "@/lib/requests";
import { StatusBadge } from "@/components/requests/status-badge";
import { t } from "@/i18n";
import { ActionPanel } from "./action-panel";
import { CancelButton } from "./cancel-button";

const STEP_ICONS: Record<StepStatus, { icon: typeof Circle; className: string }> = {
  WAITING: { icon: Circle, className: "text-border" },
  PENDING: { icon: Clock, className: "text-accent" },
  APPROVED: { icon: CheckCircle2, className: "text-brand" },
  REJECTED: { icon: XCircle, className: "text-danger" },
  SKIPPED: { icon: MinusCircle, className: "text-muted" },
};

type Details = {
  addressedTo?: string; bankName?: string; iban?: string;
  pledgeTitle?: string; pledgeBody?: string; items?: string[];
};

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const request = await db.request.findUnique({
    where: { id },
    include: {
      subject: { select: { name: true, employeeNo: true, jobTitle: true, department: { select: { name: true } } } },
      createdBy: { select: { name: true } },
      steps: {
        orderBy: { order: "asc" },
        include: { approver: { select: { name: true } }, actedBy: { select: { name: true } } },
      },
    },
  });
  if (!request) notFound();

  const involved =
    request.subjectId === user.id ||
    request.createdById === user.id ||
    request.steps.some((s) => s.approverId === user.id) ||
    ALL_REQUESTS_ROLES.includes(user.role);
  const currentStep = request.steps.find((s) => s.status === "PENDING");
  const canAct = request.status === "PENDING" && !!currentStep && canActOnStep(currentStep, user, request.subjectId);
  if (!involved && !canAct) notFound();

  const details = request.details as Details;
  const isPledge = request.type === "PLEDGE";
  const subtypeLabel = t.requests.subtypes[request.subtype as keyof typeof t.requests.subtypes];
  const canCancel = request.status === "PENDING" && request.createdById === user.id;

  const rows: [string, React.ReactNode][] = [
    [t.requests.fields.subject, `${request.subject.name} (${request.subject.employeeNo})`],
    [t.users.department, request.subject.department?.name ?? t.common.none],
    [t.requests.fields.createdAt, formatDateTime(request.createdAt)],
  ];
  if (request.createdById !== request.subjectId) rows.push([t.requests.fields.createdBy, request.createdBy.name]);
  if (request.startDate && request.endDate) {
    rows.push(
      [t.requests.fields.startDate, formatDate(request.startDate)],
      [t.requests.fields.endDate, formatDate(request.endDate)],
      [t.requests.fields.days, `${request.days} ${t.requests.daysUnit}`],
    );
  }
  if (details.addressedTo) rows.push([t.requests.fields.addressedTo, details.addressedTo]);
  if (details.bankName) rows.push([t.requests.fields.bankName, details.bankName]);
  if (details.iban) rows.push([t.requests.fields.iban, <span key="iban" dir="ltr">{details.iban}</span>]);
  if (request.notes) rows.push([t.requests.fields.notes, request.notes]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/requests" className="text-sm text-brand">← {t.requests.back}</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{subtypeLabel}</h1>
          <StatusBadge status={request.status} type={request.type} />
          <span className="text-sm text-muted" dir="ltr">{formatRequestNumber(request.number)}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card">
            <h2 className="mb-4 font-semibold">{t.requests.details}</h2>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {rows.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {isPledge && (
            <section className="card space-y-3">
              <h2 className="font-semibold">{details.pledgeTitle}</h2>
              <p className="text-sm text-muted">{t.requests.pledgeIntro}</p>
              <p className="whitespace-pre-line leading-7">{details.pledgeBody}</p>
              {details.items && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold">{t.requests.fields.items}</h3>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    {details.items.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}
            </section>
          )}

          {request.type === "LETTER" && request.status === "APPROVED" && request.subjectId === user.id && (
            <p className="rounded-lg bg-brand-soft p-3 text-sm text-brand">{t.requests.letterReady}</p>
          )}

          {canAct && <ActionPanel requestId={request.id} isPledge={isPledge} />}
          {canCancel && <CancelButton requestId={request.id} />}
        </div>

        <aside className="card h-fit">
          <h2 className="mb-4 font-semibold">{t.requests.approvalPath}</h2>
          <ol className="space-y-4">
            {request.steps.map((step) => {
              const { icon: Icon, className } = STEP_ICONS[step.status];
              const who = step.approver?.name ??
                (step.kind === "HR" ? t.requests.anyHr : step.kind === "CEO" ? t.requests.anyExecutive : t.common.none);
              return (
                <li key={step.id} className="flex gap-3">
                  <Icon size={20} className={`mt-0.5 shrink-0 ${className}`} />
                  <div className="min-w-0 text-sm">
                    <p className="font-medium">{t.requests.approverKinds[step.kind]}</p>
                    <p className="text-muted">{who}</p>
                    <p className="text-xs text-muted">{t.requests.stepStatus[step.status]}</p>
                    {step.actedAt && (
                      <p className="text-xs text-muted">
                        {step.actedBy && step.actedBy.name !== step.approver?.name && `${t.requests.by} ${step.actedBy.name} · `}
                        {formatDateTime(step.actedAt)}
                      </p>
                    )}
                    {step.comment && <p className="mt-1 rounded bg-background px-2 py-1 text-xs">{step.comment}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>
    </div>
  );
}
