"use client";

import { useActionState, useState } from "react";
import { createLeave } from "../../actions";
import { t } from "@/i18n";

const SUBTYPES = ["ANNUAL", "SICK", "BEREAVEMENT", "MARRIAGE", "UNPAID"] as const;

export function LeaveForm() {
  const [state, action, pending] = useActionState(createLeave, undefined);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const days = start && end && end >= start
    ? Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1
    : null;

  return (
    <form action={action} className="card space-y-4">
      <fieldset>
        <legend className="label">{t.requests.fields.subtype}</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {SUBTYPES.map((s, i) => (
            <label key={s} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
              <input type="radio" name="subtype" value={s} defaultChecked={i === 0} className="accent-[var(--brand)]" />
              {t.requests.subtypes[s]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="startDate">{t.requests.fields.startDate}</label>
          <input id="startDate" name="startDate" type="date" required value={start} onChange={(e) => setStart(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="endDate">{t.requests.fields.endDate}</label>
          <input id="endDate" name="endDate" type="date" required min={start || undefined} value={end} onChange={(e) => setEnd(e.target.value)} className="input" />
        </div>
      </div>
      {days !== null && (
        <p className="rounded-lg bg-brand-soft px-3 py-2 text-sm">
          {t.requests.fields.days}: <strong>{days}</strong> {t.requests.daysUnit}
        </p>
      )}
      <div>
        <label className="label" htmlFor="notes">{t.requests.fields.notes}</label>
        <textarea id="notes" name="notes" rows={3} className="input" />
      </div>
      {state?.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      <button className="btn" disabled={pending}>{t.requests.submit}</button>
    </form>
  );
}
