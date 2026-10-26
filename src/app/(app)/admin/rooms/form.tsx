"use client";

import { useEffect, useRef } from "react";
import { createRoom } from "@/app/(app)/meetings/actions";
import { t } from "@/i18n";
import { useFormAction } from "@/lib/use-form-action";

export function RoomForm() {
  const [state, onSubmit, pending] = useFormAction(createRoom);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) form.current?.reset(); }, [state]);
  const r = t.meetings.roomsAdmin;

  return (
    <form ref={form} onSubmit={onSubmit} className="card grid gap-4 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
      <div>
        <label className="label" htmlFor="name">{r.name}</label>
        <input id="name" name="name" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="capacity">{r.capacity}</label>
        <input id="capacity" name="capacity" type="number" min={1} className="input" />
      </div>
      <button className="btn" disabled={pending}>{r.add}</button>
      {state?.error && <p className="text-sm text-danger sm:col-span-3">{state.error}</p>}
    </form>
  );
}
