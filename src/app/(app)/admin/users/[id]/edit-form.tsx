"use client";

import { useActionState } from "react";
import type { Role } from "@prisma/client";
import { updateUser } from "../actions";
import { t } from "@/i18n";

type Option = { id: string; name: string; depth?: number };
type Props = {
  user: {
    id: string; employeeNo: string; name: string; email: string; role: Role; active: boolean;
    jobTitle: string | null; phone: string | null; departmentId: string | null; managerId: string | null;
  };
  departments: Option[];
  managers: Option[];
  isSelf: boolean;
};

export function EditUserForm({ user, departments, managers, isSelf }: Props) {
  const [state, action, pending] = useActionState(updateUser.bind(null, user.id), undefined);

  return (
    <form action={action} className="card grid max-w-3xl gap-4 md:grid-cols-2">
      <Field name="employeeNo" label={t.users.employeeNo} defaultValue={user.employeeNo} required ltr />
      <Field name="name" label={t.users.name} defaultValue={user.name} required />
      <Field name="email" label={t.users.email} type="email" defaultValue={user.email} required ltr />
      <Field name="phone" label={t.users.phone} type="tel" defaultValue={user.phone} ltr />
      <Field name="jobTitle" label={t.users.jobTitle} defaultValue={user.jobTitle} />
      <div>
        <label className="label" htmlFor="role">{t.users.role}</label>
        <select id="role" name="role" className="input" defaultValue={user.role} disabled={isSelf}>
          {Object.entries(t.roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        {/* الحقل المعطّل لا يُرسل مع النموذج */}
        {isSelf && <input type="hidden" name="role" value={user.role} />}
      </div>
      <div>
        <label className="label" htmlFor="departmentId">{t.users.department}</label>
        <select id="departmentId" name="departmentId" className="input" defaultValue={user.departmentId ?? ""}>
          <option value="">{t.common.none}</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{"  ".repeat(d.depth ?? 0)}{d.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="managerId">{t.users.manager}</label>
        <select id="managerId" name="managerId" className="input" defaultValue={user.managerId ?? ""}>
          <option value="">{t.common.none}</option>
          {managers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      <div>
        <Field name="password" label={t.users.newPassword} type="password" ltr />
        <p className="mt-1 text-xs text-muted">{t.users.newPasswordHint}</p>
      </div>
      <label className="flex items-center gap-2 self-center text-sm">
        <input type="checkbox" name="active" defaultChecked={user.active} disabled={isSelf} className="h-4 w-4 accent-[var(--brand)]" />
        {t.users.activeAccount}
        {isSelf && <input type="hidden" name="active" value="on" />}
      </label>
      {state?.error && <p className="text-sm text-danger md:col-span-2">{state.error}</p>}
      <div className="md:col-span-2">
        <button className="btn" disabled={pending}>{t.common.save}</button>
      </div>
    </form>
  );
}

function Field({ name, label, type = "text", defaultValue, required, ltr }: {
  name: string; label: string; type?: string; defaultValue?: string | null; required?: boolean; ltr?: boolean;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} required={required} defaultValue={defaultValue ?? undefined}
        dir={ltr ? "ltr" : undefined} autoComplete={type === "password" ? "new-password" : undefined} className="input" />
    </div>
  );
}
