"use client";

import { useState } from "react";
import { createPledge } from "../../actions";
import { t } from "@/i18n";
import { useFormAction } from "@/lib/use-form-action";

const SUBTYPES = ["UNDERTAKING", "CUSTODY"] as const;

export function PledgeForm({ employees }: { employees: { id: string; name: string; employeeNo: string }[] }) {
  const [state, onSubmit, pending] = useFormAction(createPledge);
  const [subtype, setSubtype] = useState<(typeof SUBTYPES)[number]>("UNDERTAKING");

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <fieldset>
        <legend className="label">{t.requests.fields.subtype}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {SUBTYPES.map((s) => (
            <label key={s} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
              <input type="radio" name="subtype" value={s} checked={subtype === s} onChange={() => setSubtype(s)} className="accent-[var(--brand)]" />
              {t.requests.subtypes[s]}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="subjectId">{t.requests.fields.employee}</label>
        <select id="subjectId" name="subjectId" required defaultValue="" className="input">
          <option value="" disabled>{t.common.none}</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.employeeNo})</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="pledgeTitle">{t.requests.fields.pledgeTitle}</label>
        <input id="pledgeTitle" name="pledgeTitle" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="pledgeBody">{t.requests.fields.pledgeBody}</label>
        <textarea id="pledgeBody" name="pledgeBody" rows={5} required className="input" />
      </div>
      {subtype === "CUSTODY" && (
        <div>
          <label className="label" htmlFor="items">{t.requests.fields.items}</label>
          <textarea id="items" name="items" rows={4} required className="input" />
          <p className="mt-1 text-xs text-muted">{t.requests.fields.itemsHint}</p>
        </div>
      )}
      {state?.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      <button className="btn" disabled={pending}>{t.requests.send}</button>
    </form>
  );
}
