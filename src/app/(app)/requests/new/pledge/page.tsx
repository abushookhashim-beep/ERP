import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { APPROVAL_PATHS } from "@/lib/requests";
import { FormShell } from "@/components/requests/form-shell";
import { t } from "@/i18n";
import { PledgeForm } from "./form";

export default async function NewPledgePage() {
  await requirePermission("requests.sendPledge");
  const employees = await db.user.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, employeeNo: true },
  });
  return (
    <FormShell title={t.requests.types.PLEDGE} path={APPROVAL_PATHS.PLEDGE}>
      <PledgeForm employees={employees} />
    </FormShell>
  );
}
