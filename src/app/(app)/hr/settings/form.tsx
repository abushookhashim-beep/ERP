"use client";

import { useActionState } from "react";
import { saveLeavePolicy } from "../actions";
import type { LeavePolicy } from "@/lib/leave";
import { t } from "@/i18n";

export function PolicyForm({ policy }: { policy: LeavePolicy }) {
  const [state, action, pending] = useActionState(saveLeavePolicy, undefined);
  const keys = Object.keys(policy) as (keyof LeavePolicy)[];

  return (
    <form action={action} className="card max-w-2xl space-y-4">
      <p className="text-sm text-muted">{t.hr.policy.hint}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {keys.map((k) => (
          <div key={k}>
            <label className="label" htmlFor={k}>{t.hr.policy[k]}</label>
            <input id={k} name={k} type="number" min={0} max={365} required defaultValue={policy[k]} className="input" />
          </div>
        ))}
      </div>
      {state?.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      {state?.ok && <p className="text-sm text-brand" role="status">{t.hr.saved}</p>}
      <button className="btn" disabled={pending}>{t.common.save}</button>
    </form>
  );
}
