"use client";

import { useTransition } from "react";
import { cancelMeeting } from "../actions";
import { t } from "@/i18n";

export function CancelMeetingButton({ meetingId }: { meetingId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button disabled={pending} onClick={() => confirm(t.meetings.confirmCancel) && startTransition(() => cancelMeeting(meetingId))}
      className="btn-ghost text-danger">
      {t.meetings.cancel}
    </button>
  );
}
