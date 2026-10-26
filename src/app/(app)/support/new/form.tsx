"use client";

import type { Priority, TicketCategory } from "@prisma/client";
import { createTicket } from "../actions";
import { useFormAction } from "@/lib/use-form-action";
import { t } from "@/i18n";

const f = t.support.fields;

export function TicketForm({ accept }: { accept: string }) {
  const [state, onSubmit, pending] = useFormAction(createTicket);

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div>
        <label className="label" htmlFor="title">{f.title}</label>
        <input id="title" name="title" required className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="category">{f.category}</label>
          <select id="category" name="category" required defaultValue="" className="input">
            <option value="" disabled>{t.common.none}</option>
            {(Object.keys(t.support.categories) as TicketCategory[]).map((c) => <option key={c} value={c}>{t.support.categories[c]}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="priority">{f.priority}</label>
          <select id="priority" name="priority" defaultValue="NORMAL" className="input">
            {(Object.keys(t.priority) as Priority[]).map((p) => <option key={p} value={p}>{t.priority[p]}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="description">{f.description}</label>
        <textarea id="description" name="description" required rows={5} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="attachment">{f.attachment}</label>
        <input id="attachment" name="attachment" type="file" accept={accept}
          className="input file:me-3 file:rounded file:border-0 file:bg-brand-soft file:px-3 file:py-1 file:text-brand" />
      </div>
      {state?.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      <button className="btn" disabled={pending}>{t.support.submit}</button>
    </form>
  );
}
