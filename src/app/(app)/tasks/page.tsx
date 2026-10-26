import Link from "next/link";
import { Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { todayDate } from "@/lib/hr";
import { PriorityBadge } from "@/components/priority-badge";
import { TaskStatusSelect } from "@/components/task-status";
import { t } from "@/i18n";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUser();
  const byMe = (await searchParams).tab === "byMe";
  // "التي أسندتها" تشمل مهام اجتماعاتي حتى لو كتب المحضرَ أمينُ السر
  const where: Prisma.TaskWhereInput = byMe
    ? { OR: [{ createdById: user.id }, { meeting: { organizerId: user.id } }] }
    : { assigneeId: user.id };
  const tasks = await db.task.findMany({
    where,
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      meeting: { select: { title: true } },
      assignee: { select: { name: true } },
      createdBy: { select: { name: true } },
      _count: { select: { comments: { where: { isSystem: false } } } },
    },
  });
  const today = todayDate();
  const done = tasks.filter((x) => x.status === "DONE").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t.tasks.title}</h1>
          {tasks.length > 0 && <p className="text-sm text-muted">{t.tasks.progress(done, tasks.length)}</p>}
        </div>
        <Link href="/tasks/new" className="btn"><Plus size={16} />{t.tasks.new}</Link>
      </div>
      <nav className="flex gap-1 border-b border-border">
        {[["mine", t.tasks.assignedToMe], ["byMe", t.tasks.assignedByMe]].map(([key, label]) => (
          <Link key={key} href={`/tasks?tab=${key}`}
            className={`-mb-px border-b-2 px-4 py-2 text-sm ${(key === "byMe") === byMe ? "border-brand font-semibold text-brand" : "border-transparent text-muted"}`}>
            {label}
          </Link>
        ))}
      </nav>

      {tasks.length === 0 ? (
        <p className="card py-12 text-center text-sm text-muted">{t.tasks.empty}</p>
      ) : (
        <ul className="card divide-y divide-border p-0">
          {tasks.map((task) => {
            const overdue = task.status !== "DONE" && task.dueDate && task.dueDate < today;
            return (
              <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/tasks/${task.id}`}
                      className={`font-medium hover:text-brand ${task.status === "DONE" ? "text-muted line-through" : ""}`}>
                      {task.title}
                    </Link>
                    {task.priority !== "NORMAL" && <PriorityBadge priority={task.priority} />}
                  </div>
                  <p className="text-xs text-muted">
                    {task.meeting ? `${t.tasks.from}: ${task.meeting.title}` : t.tasks.direct(task.createdBy.name)}
                    {byMe && ` · ${t.tasks.assignee}: ${task.assignee.name}`}
                    {task.dueDate && <span className={overdue ? "font-medium text-danger" : ""}> · {t.tasks.due}: {formatDate(task.dueDate)}{overdue && ` (${t.tasks.overdue})`}</span>}
                    {task._count.comments > 0 && ` · 💬 ${task._count.comments}`}
                  </p>
                </div>
                <TaskStatusSelect taskId={task.id} status={task.status} editable />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
