import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ACCEPT_ATTR } from "@/lib/files";
import { getAnnualBalance, getLeavePolicy, getSickDaysInYear } from "@/lib/leave";
import { APPROVAL_PATHS } from "@/lib/requests";
import { FormShell } from "@/components/requests/form-shell";
import { t } from "@/i18n";
import { LeaveForm } from "./form";

export default async function NewLeavePage() {
  const user = await requireUser();
  const [policy, profile] = await Promise.all([
    getLeavePolicy(),
    db.employeeProfile.findUnique({ where: { userId: user.id } }),
  ]);
  const [balance, sickUsed] = await Promise.all([
    getAnnualBalance(user.id, profile, policy),
    getSickDaysInYear(user.id, new Date().getFullYear()),
  ]);

  return (
    <FormShell title={t.requests.types.LEAVE} path={APPROVAL_PATHS.LEAVE}>
      <LeaveForm
        balance={balance && { available: balance.available, entitlement: balance.entitlement }}
        accept={ACCEPT_ATTR}
        sickInfo={t.hr.leave.sickThisYear(sickUsed, policy.sickDaysPerYear)}
      />
    </FormShell>
  );
}
