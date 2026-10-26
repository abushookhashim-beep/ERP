"use client";

import { useTransition } from "react";
import type { TaskStatus } from "@prisma/client";
import { updateTaskStatus } from "@/app/(app)/meetings/actions";
import { t } from "@/i18n";

export function TaskStatusSelect({ taskId, status, editable }: { taskId: string; status: TaskStatus; editable: boolean }) {
  const [pending, startTransition] = useTransition();
  const tone = status === "DONE" ? "bg-brand-soft text-brand" : status === "IN_PROGRESS" ? "bg-accent/15" : "bg-border";
  if (!editable) return <span className={`rounded-full px-2 py-0.5 text-xs ${tone}`}>{t.tasks.status[status]}</span>;

  return (
    <select value={status} disabled={pending} aria-label={t.tasks.status[status]}
      onChange={(e) => startTransition(() => updateTaskStatus(taskId, e.target.value as TaskStatus))}
      className={`rounded-full border-0 px-2 py-1 text-xs ${tone}`}>
      {(Object.keys(t.tasks.status) as TaskStatus[]).map((s) => <option key={s} value={s}>{t.tasks.status[s]}</option>)}
    </select>
  );
}
