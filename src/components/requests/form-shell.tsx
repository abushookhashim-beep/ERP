import Link from "next/link";
import type { ApproverKind } from "@prisma/client";
import { t } from "@/i18n";

/** إطار موحد لصفحات إنشاء الطلبات، مع عرض مسار التعميد. */
export function FormShell({ title, path, children }: { title: string; path: ApproverKind[]; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/requests/new" className="text-sm text-brand">← {t.requests.chooseType}</Link>
        <h1 className="mt-2 text-2xl font-semibold">{title}</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">{children}</div>
        <aside className="card h-fit">
          <h2 className="mb-3 text-sm font-semibold">{t.requests.approvalPath}</h2>
          <ol className="space-y-2 text-sm">
            {path.map((kind, i) => (
              <li key={kind} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">{i + 1}</span>
                {t.requests.approverKinds[kind]}
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
