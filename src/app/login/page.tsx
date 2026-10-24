"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { t } from "@/i18n";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-xl font-bold text-white">
            ERP
          </div>
          <h1 className="text-xl font-semibold">{t.appName}</h1>
          <p className="mt-1 text-sm text-muted">{t.login.subtitle}</p>
        </div>

        <form action={action} className="card space-y-4">
          <div>
            <label htmlFor="email" className="label">{t.login.email}</label>
            <input id="email" name="email" type="email" dir="ltr" required autoComplete="username"
              defaultValue={state?.email} className="input" />
          </div>
          <div>
            <label htmlFor="password" className="label">{t.login.password}</label>
            <input id="password" name="password" type="password" dir="ltr" required
              autoComplete="current-password" className="input" />
          </div>
          {state?.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
          <button type="submit" disabled={pending} className="btn w-full">
            {pending ? t.login.submitting : t.login.submit}
          </button>
        </form>
      </div>
    </main>
  );
}
