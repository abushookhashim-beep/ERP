"use client";

import { useState } from "react";
import type { MeetingMode } from "@prisma/client";
import { createMeeting } from "../actions";
import { PeoplePicker, type Person } from "@/components/people-picker";
import { t } from "@/i18n";
import { useFormAction } from "@/lib/use-form-action";

const m = t.meetings;
const MODES: MeetingMode[] = ["IN_PERSON", "ONLINE", "HYBRID"];

type Props = {
  people: Person[];
  departments: { id: string; name: string; depth: number }[];
  rooms: { id: string; name: string; capacity: number | null }[];
  accept: string;
  today: string;
};

export function MeetingForm({ people, departments, rooms, accept, today }: Props) {
  const [state, onSubmit, pending] = useFormAction(createMeeting);
  const [mode, setMode] = useState<MeetingMode>("IN_PERSON");

  return (
    <form onSubmit={onSubmit} className="card space-y-5">
      <div>
        <label className="label" htmlFor="title">{m.fields.title}</label>
        <input id="title" name="title" required className="input" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="date">{m.fields.date}</label>
          <input id="date" name="date" type="date" required min={today} defaultValue={today} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="startTime">{m.fields.startTime}</label>
          <input id="startTime" name="startTime" type="time" required defaultValue="10:00" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="endTime">{m.fields.endTime}</label>
          <input id="endTime" name="endTime" type="time" required defaultValue="11:00" className="input" />
        </div>
      </div>

      <fieldset>
        <legend className="label">{m.fields.mode}</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {MODES.map((v) => (
            <label key={v} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
              <input type="radio" name="mode" value={v} checked={mode === v} onChange={() => setMode(v)} className="accent-[var(--brand)]" />
              {m.modes[v]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        {mode !== "ONLINE" && (
          <div>
            <label className="label" htmlFor="roomId">{m.fields.room}</label>
            <select id="roomId" name="roomId" required defaultValue="" className="input">
              <option value="" disabled>{t.common.none}</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}{r.capacity ? ` (${r.capacity})` : ""}</option>)}
            </select>
          </div>
        )}
        {mode !== "IN_PERSON" && (
          <div>
            <label className="label" htmlFor="onlineUrl">{m.fields.onlineUrl}</label>
            <input id="onlineUrl" name="onlineUrl" type="url" required dir="ltr" placeholder="https://teams.microsoft.com/l/meetup-join/..." className="input" />
          </div>
        )}
      </div>

      <div>
        <span className="label">{m.fields.invitees}</span>
        <PeoplePicker name="invitees" people={people} departments={departments} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="secretaryId">{m.fields.secretary}</label>
          <select id="secretaryId" name="secretaryId" defaultValue="" className="input">
            <option value="">{t.common.none}</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="attachments">{m.fields.attachments}</label>
          <input id="attachments" name="attachments" type="file" multiple accept={accept}
            className="input file:me-3 file:rounded file:border-0 file:bg-brand-soft file:px-3 file:py-1 file:text-brand" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="agenda">{m.fields.agenda}</label>
        <textarea id="agenda" name="agenda" rows={4} placeholder={m.fields.agendaHint} className="input" />
      </div>

      {state?.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      {state?.warning && (
        <div className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm" role="alert">
          <p className="font-medium">{m.conflictsWarning}</p>
          <ul className="mt-1 list-inside list-disc">{state.warning.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      )}
      <div className="flex gap-2">
        <button className="btn" disabled={pending}>{m.create}</button>
        {state?.warning && (
          <button name="ignoreConflicts" value="1" className="btn-ghost px-4 py-2" disabled={pending}>
            {m.sendAnyway}
          </button>
        )}
      </div>
    </form>
  );
}
