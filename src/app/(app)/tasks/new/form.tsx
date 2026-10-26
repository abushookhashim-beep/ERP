"use client";

import type { Priority } from "@prisma/client";
import { createTask } from "../actions";
import { useFormAction } from "@/lib/use-form-action";
import { t } from "@/i18n";

const f = t.tasks.fields;

export function TaskForm({ people, today }: { people: { id: string; name: string; jobTitle: string | null }[]; today: string }) {
  const [state, onSubmit, pending] = useFormAction(createTask);

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div>
        <label className="label" htmlFor="title">{f.title}</label>
        <input id="title" name="title" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="description">{f.description}</label>
        <textarea id="description" name="description" rows={4} className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="assigneeId">{f.assignee}</label>
          <select id="assigneeId" name="assigneeId" required defaultValue="" className="input">
            <option value="" disabled>{t.common.none}</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}{p.jobTitle ? ` — ${p.jobTitle}` : ""}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="dueDate">{f.dueDate}</label>
          <input id="dueDate" name="dueDate" type="date" min={today} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="priority">{f.priority}</label>
          <select id="priority" name="priority" defaultValue="NORMAL" className="input">
            {(Object.keys(t.priority) as Priority[]).map((p) => <option key={p} value={p}>{t.priority[p]}</option>)}
          </select>
        </div>
      </div>
      {state?.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      <button className="btn" disabled={pending}>{t.tasks.create}</button>
    </form>
  );
}
