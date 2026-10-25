"use client";

import { useActionState } from "react";
import { saveApprovalSettings } from "./actions";
import { t } from "@/i18n";

export function ApprovalSettingsForm({ users, ceoId }: { users: { id: string; name: string }[]; ceoId: string | null }) {
  const [state, action, pending] = useActionState(saveApprovalSettings, undefined);

  return (
    <form action={action} className="card max-w-xl space-y-4">
      <div>
        <label className="label" htmlFor="ceoId">{t.approvalSettings.ceo}</label>
        <select id="ceoId" name="ceoId" defaultValue={ceoId ?? ""} className="input">
          <option value="">{t.common.none}</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <p className="mt-1 text-xs text-muted">{t.approvalSettings.ceoHint}</p>
      </div>
      {state?.ok && <p className="text-sm text-brand" role="status">{t.approvalSettings.saved}</p>}
      <button className="btn" disabled={pending}>{t.common.save}</button>
    </form>
  );
}
