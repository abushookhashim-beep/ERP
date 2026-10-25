"use client";

import { useActionState } from "react";
import { actOnRequest } from "../actions";
import { t } from "@/i18n";

export function ActionPanel({ requestId, isPledge }: { requestId: string; isPledge: boolean }) {
  const [approveState, approve, approving] = useActionState(actOnRequest.bind(null, requestId, "APPROVED"), undefined);
  const [rejectState, reject, rejecting] = useActionState(actOnRequest.bind(null, requestId, "REJECTED"), undefined);
  const error = approveState?.error ?? rejectState?.error;

  return (
    <form className="card space-y-3 border-brand">
      <label className="label" htmlFor="comment">{t.requests.comment}</label>
      <textarea id="comment" name="comment" rows={2} className="input" />
      {error && <p className="text-sm text-danger" role="alert">{error}</p>}
      <div className="flex gap-2">
        <button formAction={approve} disabled={approving || rejecting} className="btn">
          {isPledge ? t.requests.acknowledge : t.requests.approve}
        </button>
        <button formAction={reject} disabled={approving || rejecting}
          className="btn-ghost border-danger/40 px-4 py-2 text-danger">
          {isPledge ? t.requests.object : t.requests.reject}
        </button>
      </div>
    </form>
  );
}
