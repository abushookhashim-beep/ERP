"use client";

import { useActionState, useEffect, useRef } from "react";
import { createUser } from "./actions";
import { t } from "@/i18n";

type Option = { id: string; name: string; depth?: number };

export function UserForm({ departments, users }: { departments: Option[]; users: Option[] }) {
  const [state, action, pending] = useActionState(createUser, undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) form.current?.reset(); }, [state]);

  return (
    <form ref={form} action={action} className="card grid gap-4 md:grid-cols-4 md:items-end">
      <Field name="employeeNo" label={t.users.employeeNo} required ltr />
      <Field name="name" label={t.users.name} required />
      <Field name="email" label={t.users.email} type="email" required ltr />
      <Field name="password" label={t.users.password} type="password" required ltr />
      <Field name="nationalId" label={t.users.nationalId} ltr inputMode="numeric" maxLength={10} />
      <Field name="phone" label={t.users.phone} type="tel" ltr placeholder="05XXXXXXXX" />
      <Field name="jobTitle" label={t.users.jobTitle} />
      <div>
        <label className="label" htmlFor="role">{t.users.role}</label>
        <select id="role" name="role" className="input" defaultValue="EMPLOYEE">
          {Object.entries(t.roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
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
