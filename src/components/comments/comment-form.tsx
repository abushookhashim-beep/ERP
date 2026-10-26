"use client";

import { useEffect, useRef } from "react";
import type { FormState } from "@/lib/form";
import { useFormAction } from "@/lib/use-form-action";
import { t } from "@/i18n";

export function CommentForm({ action }: { action: (prev: FormState, formData: FormData) => Promise<FormState> }) {
  const [state, onSubmit, pending] = useFormAction(action);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) form.current?.reset(); }, [state]);

  return (
    <form ref={form} onSubmit={onSubmit} className="space-y-2">
      <textarea name="body" required rows={3} placeholder={t.comments.placeholder} className="input" />
      {state?.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      <button className="btn" disabled={pending}>{t.comments.send}</button>
    </form>
  );
}
