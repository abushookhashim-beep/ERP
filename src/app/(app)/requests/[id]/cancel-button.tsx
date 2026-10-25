"use client";

import { useTransition } from "react";
import { cancelRequest } from "../actions";
import { t } from "@/i18n";

export function CancelButton({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => confirm(t.requests.confirmCancel) && startTransition(() => cancelRequest(requestId))}
      className="btn-ghost text-danger"
    >
      {t.requests.cancel}
    </button>
  );
}
