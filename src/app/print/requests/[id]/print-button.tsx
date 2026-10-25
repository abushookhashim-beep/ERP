"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { t } from "@/i18n";

export function PrintButton({ auto }: { auto: boolean }) {
  useEffect(() => {
    if (!auto) return;
    // ننتظر تحميل الخط العربي قبل فتح نافذة الطباعة
    document.fonts.ready.then(() => window.print());
  }, [auto]);

  return (
    <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3 print:hidden">
      <p className="text-sm text-muted">{t.requests.doc.printHint}</p>
      <button onClick={() => window.print()} className="btn">
        <Printer size={16} />{t.requests.doc.printButton}
      </button>
    </div>
  );
}
