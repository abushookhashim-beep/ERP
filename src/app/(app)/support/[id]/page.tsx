import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { formatTicketNumber, getTicketForUser, supportTeamWhere } from "@/lib/support";
import { CommentForm } from "@/components/comments/comment-form";
import { CommentThread } from "@/components/comments/thread";
import { PriorityBadge } from "@/components/priority-badge";
import { TicketStatusBadge } from "@/components/support/ticket-status";
import { t } from "@/i18n";
import { addTicketComment } from "../actions";
import { ManagePanel, ResolutionPanel } from "./panels";

const s = t.support;

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const view = await getTicketForUser((await params).id, user);
  if (!view) notFound();
  const { ticket: tk, isSupport, isRequester } = view;
  const team = isSupport
    ? await db.user.findMany({ where: supportTeamWhere, orderBy: { name: "asc" }, select: { id: true, name: true } })
    : [];

  const rows: [string, React.ReactNode][] = [
    [s.fields.requester, `${tk.requester.name}${tk.requester.department ? ` · ${tk.requester.department.name}` : ""}`],
    ...(isSupport && tk.requester.phone ? [[t.users.phone, <span key="ph" dir="ltr">{tk.requester.phone}</span>] as [string, React.ReactNode]] : []),
    [s.fields.category, s.categories[tk.category]],
    [s.fields.priority, <PriorityBadge key="p" priority={tk.priority} />],
    [s.fields.assignee, tk.assignee?.name ?? s.unassigned],
    [s.fields.createdAt, formatDateTime(tk.createdAt)],
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/support" className="text-sm text-brand">← {s.back}</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{tk.title}</h1>
          <TicketStatusBadge status={tk.status} forSupport={isSupport && !isRequester} />
          <span className="text-sm text-muted" dir="ltr">{formatTicketNumber(tk.number)}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card space-y-3">
            <p className="whitespace-pre-line text-sm leading-7">{tk.description}</p>
            {tk.attachment && (
              <a href={`/api/files/${tk.attachment.id}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-brand">
                <FileText size={14} />{tk.attachment.name}
              </a>
            )}
          </section>
          <section className="card space-y-4">
            <h2 className="font-semibold">{t.comments.title}</h2>
            <CommentThread comments={tk.comments} />
            {tk.status !== "CLOSED" && <CommentForm action={addTicketComment.bind(null, tk.id)} />}
          </section>
        </div>

        <aside className="space-y-6">
          {isRequester && tk.status === "RESOLVED" && <ResolutionPanel ticketId={tk.id} />}
          {isSupport && tk.status !== "CLOSED" && (
            // المفتاح يعيد بناء النموذج بعد كل تحديث حتى تعكس القوائم القيم الحالية
            <ManagePanel key={`${tk.status}-${tk.assigneeId}`} ticketId={tk.id} status={tk.status}
              assigneeId={tk.assigneeId} team={team} me={user.id} />
          )}
          <section className="card">
            <dl className="space-y-3 text-sm">
              {rows.map(([label, value]) => (
                <div key={label}><dt className="text-muted">{label}</dt><dd className="font-medium">{value}</dd></div>
              ))}
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
