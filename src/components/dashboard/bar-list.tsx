const number = new Intl.NumberFormat("ar-SA-u-nu-latn");

type Row = { label: string; value: number };

/** مخطط أعمدة أفقي لسلسلة واحدة: القيمة عند طرف العمود، والتفاصيل عند المرور. */
export function BarList({ rows, unit }: { rows: Row[]; unit: string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <ul className="space-y-3" role="list">
      {rows.map((row) => (
        <li key={row.label} className="group relative grid grid-cols-[minmax(0,10rem)_1fr] items-center gap-3 text-sm">
          <span className="truncate text-muted" title={row.label}>{row.label}</span>
          <div className="flex items-center gap-2">
            <div
              className="h-5 rounded-e-[4px] bg-brand transition-opacity group-hover:opacity-80"
              style={{ width: `${(row.value / max) * 85}%`, minWidth: 4 }}
            />
            <span className="tabular-nums">{number.format(row.value)}</span>
          </div>
          <span
            role="tooltip"
            className="pointer-events-none absolute -top-8 start-40 z-10 hidden whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background shadow group-hover:block"
          >
            {row.label}: {number.format(row.value)} {unit}
          </span>
        </li>
      ))}
    </ul>
  );
}
