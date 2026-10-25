import { requireUser } from "@/lib/auth";
import { APPROVAL_PATHS } from "@/lib/requests";
import { FormShell } from "@/components/requests/form-shell";
import { t } from "@/i18n";
import { LetterForm } from "./form";

export default async function NewLetterPage() {
  await requireUser();
  return (
    <FormShell title={t.requests.types.LETTER} path={APPROVAL_PATHS.LETTER}>
      <LetterForm />
    </FormShell>
  );
}
