"use client";

import { useEffect, useRef } from "react";
import { createUser } from "./actions";
import { t } from "@/i18n";
import { useFormAction } from "@/lib/use-form-action";
import { DEFAULT_ROLE_ID } from "@/lib/permissions";

type Option = { id: string; name: string; depth?: number };

export function UserForm({ departments, users, roles }: { departments: Option[]; users: Option[]; roles: Option[] }) {
  const [state, onSubmit, pending] = useFormAction(createUser);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) form.current?.reset(); }, [state]);

  return (
    <form ref={form} onSubmit={onSubmit} className="card grid gap-4 md:grid-cols-4 md:items-end">
      <Field name="employeeNo" label={t.users.employeeNo} required ltr />
      <Field name="name" label={t.users.name} required />
      <Field name="email" label={t.users.email} type="email" required ltr />
      <Field name="password" label={t.users.password} type="password" required ltr />
      <Field name="nationalId" label={t.users.nationalId} ltr inputMode="numeric" maxLength={10} />
      <Field name="phone" label={t.users.phone} type="tel" ltr placeholder="05XXXXXXXX" />
      <Field name="jobTitle" label={t.users.jobTitle} />
      <div>
        <label className="label" htmlFor="roleId">{t.users.role}</label>
        <select id="roleId" name="roleId" className="input" defaultValue={DEFAULT_ROLE_ID}>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="departmentId">{t.users.department}</label>
        <select id="departmentId" name="departmentId" className="input">
          <option value="">{t.common.none}</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{"\u00A0\u00A0".repeat(d.depth ?? 0)}{d.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="managerId">{t.users.manager}</label>
        <select id="managerId" name="managerId" className="input">
          <option value="">{t.common.none}</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      <button className="btn md:col-start-4 md:row-start-3" disabled={pending}>{t.users.add}</button>
      {state?.error && <p className="text-sm text-danger md:col-span-4">{state.error}</p>}
    </form>
  );
}

function Field({ name, label, type = "text", required, ltr, ...rest }: {
  name: string; label: string; type?: string; required?: boolean; ltr?: boolean;
} & Pick<React.InputHTMLAttributes<HTMLInputElement>, "inputMode" | "maxLength" | "placeholder">) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} required={required} dir={ltr ? "ltr" : undefined} className="input" {...rest} />
    </div>
  );
}
