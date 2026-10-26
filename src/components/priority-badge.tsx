import type { Priority } from "@prisma/client";
import { t } from "@/i18n";

const STYLES: Record<Priority, string> = {
  LOW: "bg-border text-muted",
  NORMAL: "bg-brand-soft text-brand",
  HIGH: "bg-accent/15 text-foreground",
  URGENT: "bg-danger/10 text-danger",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[priority]}`}>{t.priority[priority]}</span>;
}
