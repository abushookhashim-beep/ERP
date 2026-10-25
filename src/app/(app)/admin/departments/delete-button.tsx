"use client";

import { useTransition } from "react";
import { deleteDepartment } from "./actions";
import { t } from "@/i18n";

export function DeleteDepartmentButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (!confirm(t.departments.confirmDelete)) return;
    startTransition(async () => {
      const result = await deleteDepartment(id);
      if (result?.error) alert(result.error);
    });
  };

  return (
    <button onClick={onClick} disabled={pending} className="btn-ghost text-xs text-danger">
      {t.common.delete}
    </button>
  );
}
