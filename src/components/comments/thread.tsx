import { formatDateTime } from "@/lib/format";
import { t } from "@/i18n";

type CommentRow = { id: string; body: string; isSystem: boolean; createdAt: Date; author: { name: string } };

export function CommentThread({ comments }: { comments: CommentRow[] }) {
  if (comments.length === 0) return <p className="py-4 text-center text-sm text-muted">{t.comments.empty}</p>;
  return (
    <ol className="space-y-3">
      {comments.map((c) =>
        c.isSystem ? (
          <li key={c.id} className="text-center text-xs text-muted">
            {c.author.name} · {c.body} · {formatDateTime(c.createdAt)}
          </li>
        ) : (
          <li key={c.id} className="rounded-lg bg-background p-3">
            <p className="mb-1 text-xs text-muted"><span className="font-semibold text-foreground">{c.author.name}</span> · {formatDateTime(c.createdAt)}</p>
            <p className="whitespace-pre-line text-sm">{c.body}</p>
          </li>
        ),
      )}
    </ol>
  );
}
