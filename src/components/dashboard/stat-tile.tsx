import type { LucideIcon } from "lucide-react";

const number = new Intl.NumberFormat("ar-SA-u-nu-latn");

type Props = { label: string; value: number | null; icon: LucideIcon; hint?: string };

export function StatTile({ label, value, icon: Icon, hint }: Props) {
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <Icon size={16} />
        </span>
      </div>
      <p className="text-3xl font-semibold tabular-nums">{value === null ? "—" : number.format(value)}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
