import type { RequestStatus, RequestType } from "@prisma/client";
import { t } from "@/i18n";

const STYLES: Record<RequestStatus, string> = {
  PENDING: "bg-accent/15 text-foreground",
  APPROVED: "bg-brand-soft text-brand",
  REJECTED: "bg-danger/10 text-danger",
  CANCELLED: "bg-border text-muted",
};

export function StatusBadge({ status, type }: { status: RequestStatus; type?: RequestType }) {
  const labels = type === "PLEDGE" ? t.requests.pledgeStatus : t.requests.status;
  return (
    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {labels[status]}
    </span>
  );
}
