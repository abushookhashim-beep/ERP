"use client";

import { useActionState } from "react";
import { changePassword } from "./actions";
import { t } from "@/i18n";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);

  return (
    <form action={action} className="card space-y-4">
      <Field name="current" label={t.changePassword.current} autoComplete="current-password" />
      <div>
        <Field name="next" label={t.changePassword.next} autoComplete="new-password" />
        <p className="mt-1 text-xs text-muted">{t.changePassword.rules}</p>
      </div>
      <Field name="confirm" label={t.changePassword.confirm} autoComplete="new-password" />
      {state?.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      <button className="btn w-full" disabled={pending}>{t.changePassword.submit}</button>
    </form>
  );
}

function Field({ name, label, autoComplete }: { name: string; label: string; autoComplete: string }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type="password" dir="ltr" required autoComplete={autoComplete} className="input" />
    </div>
  );
}
