import { ComingSoon } from "@/components/coming-soon";
import { requireRole } from "@/lib/auth";
import { t } from "@/i18n";

export default async function Page() {
  await requireRole("ADMIN", "FINANCE", "EXECUTIVE");
  return <ComingSoon title={t.nav.finance} />;
}
