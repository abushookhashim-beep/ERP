"use client";

import { useEffect, useRef } from "react";
import { createDepartment } from "./actions";
import { t } from "@/i18n";
import { useFormAction } from "@/lib/use-form-action";

type Option = { id: string; name: string; depth?: number };

export function DepartmentForm({ departments, users }: { departments: Option[]; users: Option[] }) {
  const [state, onSubmit, pending] = useFormAction(createDepartment);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) form.current?.reset(); }, [state]);

  return (
    <form ref={form} onSubmit={onSubmit} className="card grid gap-4 md:grid-cols-4 md:items-end">
      <div>
        <label className="label" htmlFor="name">{t.departments.name}</label>
        <input id="name" name="name" required className="input" />
      </div>
      <div>
        <label className="label" htmlFor="parentId">{t.departments.parent}</label>
        <select id="parentId" name="parentId" className="input">
          <option value="">{t.common.none}</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{"\u00A0\u00A0".repeat(d.depth ?? 0)}{d.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="headId">{t.departments.head}</label>
        <select id="headId" name="headId" className="input">
          <option value="">{t.common.none}</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      <button className="btn" disabled={pending}>{t.departments.add}</button>
      {state?.error && <p className="text-sm text-danger md:col-span-4">{state.error}</p>}
    </form>
  );
}
