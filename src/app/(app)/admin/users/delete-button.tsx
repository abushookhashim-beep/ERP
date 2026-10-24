"use client";

import { useTransition } from "react";
import { deleteUser } from "./actions";
import { t } from "@/i18n";

export function DeleteUserButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (!confirm(t.users.confirmDelete)) return;
    startTransition(async () => {
      const result = await deleteUser(id);
      if (result?.error) alert(result.error);
    });
  };

  return (
    <button onClick={onClick} disabled={pending} className="btn-ghost text-xs text-danger">
      {t.common.delete}
    </button>
  );
}
