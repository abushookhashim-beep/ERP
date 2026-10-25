import Link from "next/link";
import { CalendarDays, FileText, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PLEDGE_SENDER_ROLES } from "@/lib/requests";
import { t } from "@/i18n";

export default async function NewRequestPage() {
  const user = await requireUser();
  const options = [
    { href: "/requests/new/leave", title: t.requests.types.LEAVE, hint: t.requests.typeHints.LEAVE, icon: CalendarDays },
    { href: "/requests/new/letter", title: t.requests.types.LETTER, hint: t.requests.typeHints.LETTER, icon: FileText },
    ...(PLEDGE_SENDER_ROLES.includes(user.role)
      ? [{ href: "/requests/new/pledge", title: t.requests.types.PLEDGE, hint: t.requests.typeHints.PLEDGE, icon: ShieldCheck }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/requests" className="text-sm text-brand">← {t.requests.back}</Link>
        <h1 className="mt-2 text-2xl font-semibold">{t.requests.chooseType}</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((o) => (
          <Link key={o.href} href={o.href} className="card flex items-start gap-4 transition hover:border-brand">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <o.icon size={22} />
            </span>
            <span>
              <span className="block font-semibold">{o.title}</span>
              <span className="mt-1 block text-sm text-muted">{o.hint}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
