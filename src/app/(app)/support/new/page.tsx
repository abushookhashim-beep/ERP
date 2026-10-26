import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ACCEPT_ATTR } from "@/lib/files";
import { t } from "@/i18n";
import { TicketForm } from "./form";

export default async function NewTicketPage() {
  await requireUser();
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/support" className="text-sm text-brand">← {t.support.back}</Link>
        <h1 className="mt-2 text-2xl font-semibold">{t.support.new}</h1>
      </div>
      <TicketForm accept={ACCEPT_ATTR} />
    </div>
  );
}
