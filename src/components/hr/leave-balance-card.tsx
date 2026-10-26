import { CalendarDays } from "lucide-react";
import type { AnnualBalance } from "@/lib/leave";
import { t } from "@/i18n";

export function LeaveBalanceCard({ balance, sickInfo }: { balance: AnnualBalance | null; sickInfo?: string }) {
  return (
    <section className="card">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <CalendarDays size={18} className="text-brand" />
        {t.hr.leave.balance}
      </h3>
      {balance ? (
        <>
          <p className="text-3xl font-semibold tabular-nums">
            {balance.available} <span className="text-base font-normal text-muted">{t.hr.leave.daysUnit}</span>
          </p>
          <p className="mt-1 text-xs text-muted">{t.hr.leave.entitlement(balance.entitlement)}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div><dt className="text-muted">{t.hr.leave.accrued}</dt><dd className="font-medium">{balance.accrued}</dd></div>
            <div><dt className="text-muted">{t.hr.leave.used}</dt><dd className="font-medium">{balance.used}</dd></div>
          </dl>
        </>
      ) : (
        <p className="text-sm text-muted">{t.hr.leave.unknown}</p>
      )}
      {sickInfo && <p className="mt-3 border-t border-border pt-3 text-xs text-muted">{sickInfo}</p>}
    </section>
  );
}
