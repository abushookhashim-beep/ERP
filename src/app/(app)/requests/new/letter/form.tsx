"use client";

import { useState } from "react";
import { createLetter } from "../../actions";
import { t } from "@/i18n";
import { useFormAction } from "@/lib/use-form-action";

const SUBTYPES = ["SALARY_INTRO", "SALARY_TRANSFER"] as const;

export function LetterForm() {
  const [state, onSubmit, pending] = useFormAction(createLetter);
  const [subtype, setSubtype] = useState<(typeof SUBTYPES)[number]>("SALARY_INTRO");

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
        <label className="label" htmlFor="addressedTo">{t.requests.fields.addressedTo}</label>
        <input id="addressedTo" name="addressedTo" required className="input" />
      </div>
      {subtype === "SALARY_TRANSFER" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="bankName">{t.requests.fields.bankName}</label>
            <input id="bankName" name="bankName" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="iban">{t.requests.fields.iban}</label>
            <input id="iban" name="iban" required dir="ltr" placeholder="SA00 0000 0000 0000 0000 0000" className="input" />
          </div>
        </div>
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
