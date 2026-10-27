import { ComingSoon } from "@/components/coming-soon";
import { requirePermission } from "@/lib/auth";
import { t } from "@/i18n";

export default async function Page() {
  await requirePermission("finance.view");
  return <ComingSoon title={t.nav.finance} />;
}
