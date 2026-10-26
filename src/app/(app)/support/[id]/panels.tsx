"use client";

import type { TicketStatus } from "@prisma/client";
import { manageTicket, respondToResolution } from "../actions";
import { useFormAction } from "@/lib/use-form-action";
import { t } from "@/i18n";

const s = t.support;

export function ManagePanel({ ticketId, status, assigneeId, team, me }: {
  ticketId: string; status: TicketStatus; assigneeId: string | null; team: { id: string; name: string }[]; me: string;
}) {
  const [state, onSubmit, pending] = useFormAction(manageTicket.bind(null, ticketId));

  return (
    <section className="card space-y-3 border-brand">
      <h2 className="font-semibold">{s.manage}</h2>
      {!assigneeId && (
        <form onSubmit={onSubmit}>
          <input type="hidden" name="assigneeId" value={me} />
          <button className="btn w-full" disabled={pending}>{s.assignToMe}</button>
        </form>
      )}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="label" htmlFor="status">{s.fields.status}</label>
          <select id="status" name="status" defaultValue={status} className="input">
            {(Object.keys(s.statusForIt) as TicketStatus[]).map((x) => <option key={x} value={x}>{s.statusForIt[x]}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="assigneeId">{s.fields.assignee}</label>
          <select id="assigneeId" name="assigneeId" defaultValue={assigneeId ?? ""} className="input">
            <option value="">{s.unassigned}</option>
            {team.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        {state?.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
        <button className="btn-ghost w-full py-2" disabled={pending}>{s.update}</button>
      </form>
    </section>
  );
}

export function ResolutionPanel({ ticketId }: { ticketId: string }) {
  const [, accept, accepting] = useFormAction(respondToResolution.bind(null, ticketId, true));
  const [, reopen, reopening] = useFormAction(respondToResolution.bind(null, ticketId, false));

  return (
    <section className="card space-y-3 border-brand">
      <p className="text-sm">{s.resolvedHint}</p>
      <form onSubmit={accept}><button className="btn w-full" disabled={accepting || reopening}>{s.close}</button></form>
      <form onSubmit={reopen} className="space-y-2">
        <textarea name="body" rows={2} placeholder={t.comments.placeholder} className="input" />
        <button className="btn-ghost w-full py-2 text-danger" disabled={accepting || reopening}>{s.reopen}</button>
      </form>
    </section>
  );
}
