"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { t } from "@/i18n";

export type Person = { id: string; name: string; departmentId: string | null; jobTitle: string | null };
type Dept = { id: string; name: string; depth: number };

/** اختيار موظفين بالبحث أو بإضافة إدارة كاملة. القيم تُرسل كحقول مخفية باسم name. */
export function PeoplePicker({ name, people, departments }: { name: string; people: Person[]; departments: Dept[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const matches = query.trim()
    ? people.filter((p) => !selected.includes(p.id) && p.name.includes(query.trim())).slice(0, 8)
    : [];
  const add = (ids: string[]) => setSelected((cur) => [...new Set([...cur, ...ids])]);

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.meetings.searchPeople} className="input" />
          {matches.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
              {matches.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => { add([p.id]); setQuery(""); }}
                    className="w-full px-3 py-2 text-start text-sm hover:bg-brand-soft">
                    {p.name}{p.jobTitle && <span className="text-muted"> · {p.jobTitle}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <select value="" onChange={(e) => add(people.filter((p) => p.departmentId === e.target.value).map((p) => p.id))}
          className="input sm:w-64">
          <option value="">{t.meetings.addDepartment}</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{"  ".repeat(d.depth)}{d.name}</option>)}
        </select>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs text-muted">{selected.length}</span>
          {selected.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-sm">
              {byId.get(id)?.name}
              <button type="button" aria-label={t.common.delete} onClick={() => setSelected(selected.filter((s) => s !== id))}>
                <X size={14} />
              </button>
              <input type="hidden" name={name} value={id} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
