import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import { todayDate } from "@/lib/hr";
import { getTaskForUser } from "@/lib/tasks";
import { CommentForm } from "@/components/comments/comment-form";
import { CommentThread } from "@/components/comments/thread";
import { PriorityBadge } from "@/components/priority-badge";
import { TaskStatusSelect } from "@/components/task-status";
import { t } from "@/i18n";
import { addTaskComment } from "../actions";

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const view = await getTaskForUser((await params).id, user.id);
  if (!view) notFound();
  const { task } = view;
  const f = t.tasks.fields;
  const overdue = task.status !== "DONE" && task.dueDate && task.dueDate < todayDate();

  const rows: [string, React.ReactNode][] = [
    [f.assignee, task.assignee.name],
    [f.createdBy, task.createdBy.name],
    [f.createdAt, formatDateTime(task.createdAt)],
    [f.dueDate, task.dueDate
      ? <span className={overdue ? "text-danger" : ""}>{formatDate(task.dueDate)}{overdue && ` (${t.tasks.overdue})`}</span>
      : t.common.none],
    [f.priority, <PriorityBadge key="p" priority={task.priority} />],
  ];
  if (task.meeting) {
    rows.push([t.tasks.from, <Link key="m" href={`/meetings/${task.meeting.id}`} className="text-brand">{task.meeting.title}</Link>]);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/tasks" className="text-sm text-brand">← {t.tasks.back}</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{task.title}</h1>
          <TaskStatusSelect taskId={task.id} status={task.status} editable />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {task.description && (
            <section className="card"><p className="whitespace-pre-line text-sm leading-7">{task.description}</p></section>
          )}
          <section className="card space-y-4">
            <h2 className="font-semibold">{t.comments.title}</h2>
            <CommentThread comments={task.comments} />
            <CommentForm action={addTaskComment.bind(null, task.id)} />
          </section>
        </div>
        <aside className="card h-fit">
          <dl className="space-y-3 text-sm">
            {rows.map(([label, value]) => (
              <div key={label}><dt className="text-muted">{label}</dt><dd className="font-medium">{value}</dd></div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
}
