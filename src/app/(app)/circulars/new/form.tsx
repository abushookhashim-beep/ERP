"use client";

import { useState } from "react";
import type { CircularAudience, CircularCategory } from "@prisma/client";
import { publishCircular } from "../actions";
import { PeoplePicker, type Person } from "@/components/people-picker";
import { useFormAction } from "@/lib/use-form-action";
import { t } from "@/i18n";

const c = t.circulars;
const f = c.fields;
type Dept = { id: string; name: string; depth: number };

export function CircularForm({ full, people, departments, accept }: {
  full: boolean; people: Person[]; departments: Dept[]; accept: string;
}) {
  const [state, onSubmit, pending] = useFormAction(publishCircular);
  const [audience, setAudience] = useState<CircularAudience>(full ? "ALL" : "DEPARTMENTS");
  const audiences: CircularAudience[] = full ? ["ALL", "DEPARTMENTS", "PEOPLE"] : ["DEPARTMENTS"];

  return (
    <form onSubmit={onSubmit} className="card space-y-5">
      {!full && <p className="rounded-lg bg-brand-soft p-3 text-sm">{c.scopeLimited}</p>}
      <div>
        <label className="label" htmlFor="title">{f.title}</label>
        <input id="title" name="title" required className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="category">{f.category}</label>
          <select id="category" name="category" defaultValue="GENERAL" className="input">
            {(Object.keys(c.categories) as CircularCategory[]).map((k) => <option key={k} value={k}>{c.categories[k]}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="expiresAt">{f.expiresAt}</label>
          <input id="expiresAt" name="expiresAt" type="date" className="input" />
          <p className="mt-1 text-xs text-muted">{f.expiresHint}</p>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="body">{f.body}</label>
        <textarea id="body" name="body" required rows={8} className="input leading-7" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="important" className="h-4 w-4 accent-[var(--brand)]" />
        {f.important}
      </label>

      <fieldset className="space-y-3">
        <legend className="label">{f.audience}</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {audiences.map((a) => (
            <label key={a} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
              <input type="radio" name="audience" value={a} checked={audience === a} onChange={() => setAudience(a)} className="accent-[var(--brand)]" />
              {c.audiences[a]}
            </label>
          ))}
        </div>
        {audience === "DEPARTMENTS" && (
          <div>
            <span className="label">{f.departments}</span>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-3">
              {departments.map((d) => (
                <label key={d.id} className="flex items-center gap-2 text-sm" style={{ paddingInlineStart: `${d.depth * 1.25}rem` }}>
                  <input type="checkbox" name="departments" value={d.id} className="h-4 w-4 accent-[var(--brand)]" />
                  {d.name}
                </label>
              ))}
            </div>
          </div>
        )}
        {audience === "PEOPLE" && (
          <div>
            <span className="label">{f.people}</span>
            <PeoplePicker name="people" people={people} departments={departments} />
          </div>
        )}
      </fieldset>

      <div>
        <label className="label" htmlFor="attachments">{f.attachments}</label>
        <input id="attachments" name="attachments" type="file" multiple accept={accept}
          className="input file:me-3 file:rounded file:border-0 file:bg-brand-soft file:px-3 file:py-1 file:text-brand" />
      </div>

      {state?.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      <button className="btn" disabled={pending}>{c.publish}</button>
    </form>
  );
}
