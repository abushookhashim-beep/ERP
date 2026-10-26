"use client";

import { useEffect, useRef } from "react";
import { addDocument } from "../../actions";
import { t } from "@/i18n";
import { useFormAction } from "@/lib/use-form-action";

export function DocumentForm({ userId, accept }: { userId: string; accept: string }) {
  const [state, onSubmit, pending] = useFormAction(addDocument.bind(null, userId));
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) form.current?.reset(); }, [state]);
  const d = t.hr.documents;

  return (
    <form ref={form} onSubmit={onSubmit} className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <label className="label" htmlFor="type">{d.type}</label>
        <select id="type" name="type" required className="input">
          {Object.entries(d.types).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="number">{d.number}</label>
        <input id="number" name="number" dir="ltr" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="expiryDate">{d.expiryDate}</label>
        <input id="expiryDate" name="expiryDate" type="date" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="issueDate">{d.issueDate}</label>
        <input id="issueDate" name="issueDate" type="date" className="input" />
      </div>
      <div className="lg:col-span-2">
        <label className="label" htmlFor="file">{d.file}</label>
        <input id="file" name="file" type="file" accept={accept}
          className="input file:me-3 file:rounded file:border-0 file:bg-brand-soft file:px-3 file:py-1 file:text-brand" />
      </div>
      <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3">
        <button className="btn" disabled={pending}>{d.add}</button>
        {state?.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      </div>
    </form>
  );
}
