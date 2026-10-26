"use client";

import { useState, useTransition, type FormEvent } from "react";

/**
 * بديل لـ useActionState لا يمسح حقول النموذج بعد الإرسال.
 * (React يعيد تعيين النماذج المرتبطة بـ action تلقائياً، فيضيع ما كتبه المستخدم عند ظهور خطأ.)
 * يرسل أيضاً اسم وقيمة الزر الذي ضُغط.
 */
// S تشمل undefined (الحالة قبل أول إرسال)، مثل FormState
export function useFormAction<S>(action: (prev: S, formData: FormData) => Promise<S>) {
  const [state, setState] = useState<S>(undefined as S);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(async () => setState(await action(state, formData)));
  };

  return [state, onSubmit, pending] as const;
}
