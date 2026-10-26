"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { approveMinutes } from "../actions";
import { useFormAction } from "@/lib/use-form-action";
import { t } from "@/i18n";

const mm = t.meetings.minutes;
type Person = { id: string; name: string; accepted: boolean };

export function MinutesForm({ meetingId, people }: { meetingId: string; people: Person[] }) {
  const [state, onSubmit, pending] = useFormAction(approveMinutes.bind(null, meetingId));
  const [rows, setRows] = useState([0]);
  const [next, setNext] = useState(1);

  return (
    <form onSubmit={(e) => (confirm(mm.confirmApprove) ? onSubmit(e) : e.preventDefault())} className="card space-y-5">
      <h2 className="font-semibold">{mm.title}</h2>

      <fieldset>
        <legend className="label">{mm.attendance}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {people.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="attended" value={p.id} defaultChecked={p.accepted} className="h-4 w-4 accent-[var(--brand)]" />
              {p.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="label" htmlFor="minutes">{mm.discussion}</label>
        <textarea id="minutes" name="minutes" rows={6} className="input" />
      </div>

      <div className="space-y-2">
        <span className="label">{mm.decisions}</span>
        {rows.map((key) => (
          <div key={key} className="grid gap-2 rounded-lg border border-border p-2 sm:grid-cols-[1fr_12rem_10rem_auto]">
            <input name="taskTitle" placeholder={mm.decision} className="input" />
            <select name="taskAssignee" defaultValue="" className="input" aria-label={mm.assignee}>
              <option value="">{mm.assignee}</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input name="taskDue" type="date" className="input" aria-label={mm.due} />
            <button type="button" aria-label={t.common.delete} onClick={() => setRows(rows.filter((r) => r !== key))}
              className="self-center rounded p-2 text-danger hover:bg-danger/10">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => { setRows([...rows, next]); setNext(next + 1); }} className="btn-ghost">
          <Plus size={16} />{mm.addDecision}
        </button>
      </div>

      {state?.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      <button className="btn" disabled={pending}>{mm.approve}</button>
    </form>
  );
}
