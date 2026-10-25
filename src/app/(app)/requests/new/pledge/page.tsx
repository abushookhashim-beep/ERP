import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { APPROVAL_PATHS, PLEDGE_SENDER_ROLES } from "@/lib/requests";
import { FormShell } from "@/components/requests/form-shell";
import { t } from "@/i18n";
import { PledgeForm } from "./form";

export default async function NewPledgePage() {
  await requireRole(...PLEDGE_SENDER_ROLES);
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
