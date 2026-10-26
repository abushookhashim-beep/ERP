import type { TicketStatus } from "@prisma/client";
import { t } from "@/i18n";

const STYLES: Record<TicketStatus, string> = {
  NEW: "bg-accent text-white",
  IN_PROGRESS: "bg-accent/15 text-foreground",
  WAITING_USER: "bg-danger/10 text-danger",
  RESOLVED: "bg-brand-soft text-brand",
  CLOSED: "bg-border text-muted",
};

export function TicketStatusBadge({ status, forSupport }: { status: TicketStatus; forSupport: boolean }) {
  const labels = forSupport ? t.support.statusForIt : t.support.status;
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>{labels[status]}</span>;
}
