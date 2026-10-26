"use client";

import { useState, useTransition } from "react";
import { BellRing, CheckCircle2 } from "lucide-react";
import { acknowledgeCircular, remindCircular } from "../actions";
import { t } from "@/i18n";

export function AcknowledgeButton({ circularId }: { circularId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button disabled={pending} onClick={() => startTransition(() => acknowledgeCircular(circularId))} className="btn w-full sm:w-auto">
      <CheckCircle2 size={16} />{t.circulars.acknowledge}
    </button>
  );
}

export function RemindButton({ circularId }: { circularId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string>();
  return (
    <div className="space-y-1">
      <button disabled={pending} className="btn-ghost w-full py-2"
        onClick={() => startTransition(async () => {
          const r = await remindCircular(circularId);
          setResult(r.error ?? t.circulars.tracking.reminded(r.count ?? 0));
        })}>
        <BellRing size={16} />{t.circulars.tracking.remind}
      </button>
      {result && <p className="text-center text-xs text-brand" role="status">{result}</p>}
    </div>
  );
}
