import { requireUser } from "@/lib/auth";
import { APPROVAL_PATHS } from "@/lib/requests";
import { FormShell } from "@/components/requests/form-shell";
import { t } from "@/i18n";
import { LeaveForm } from "./form";

export default async function NewLeavePage() {
  await requireUser();
  return (
    <FormShell title={t.requests.types.LEAVE} path={APPROVAL_PATHS.LEAVE}>
      <LeaveForm />
    </FormShell>
  );
}
