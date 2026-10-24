import { Hammer } from "lucide-react";
import { t } from "@/i18n";

export function ComingSoon({ title }: { title: string }) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">{title}</h1>
      <div className="card flex flex-col items-center gap-3 py-16 text-center text-muted">
        <Hammer size={32} />
        <p>{t.comingSoon}</p>
      </div>
    </div>
  );
}
