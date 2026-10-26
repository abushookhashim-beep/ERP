"use client";

import { useState, useTransition } from "react";
import type { InviteResponse } from "@prisma/client";
import { respondToInvite } from "../actions";
import { t } from "@/i18n";

const OPTIONS: Exclude<InviteResponse, "PENDING">[] = ["ACCEPTED", "TENTATIVE", "DECLINED"];

export function Rsvp({ meetingId, current }: { meetingId: string; current: InviteResponse }) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");

  const send = (r: InviteResponse) => {
    const fd = new FormData();
    fd.set("note", note);
    startTransition(() => respondToInvite(meetingId, r, fd));
  };

  return (
    <section className="card space-y-3 border-brand">
      <h2 className="font-semibold">{t.meetings.yourResponse}: <span className="text-brand">{t.meetings.responses[current]}</span></h2>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((r) => (
          <button key={r} type="button" disabled={pending} onClick={() => send(r)}
            className={current === r ? "btn" : "btn-ghost px-4 py-2"}>
            {t.meetings.respond[r]}
          </button>
        ))}
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.meetings.declineReason} className="input" />
    </section>
  );
}
