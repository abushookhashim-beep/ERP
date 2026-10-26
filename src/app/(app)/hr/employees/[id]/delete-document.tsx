"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteDocument } from "../../actions";
import { t } from "@/i18n";

export function DeleteDocumentButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button disabled={pending} aria-label={t.common.delete} title={t.common.delete}
      onClick={() => confirm(t.hr.documents.confirmDelete) && startTransition(() => deleteDocument(id))}
      className="rounded p-1 text-danger hover:bg-danger/10">
      <Trash2 size={16} />
    </button>
  );
}
