import Link from "next/link";
import { KeyRound } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { t } from "@/i18n";
import { ChangePasswordForm } from "./form";

export default async function ChangePasswordPage() {
  const user = await requireUser();

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white">
            <KeyRound size={22} />
          </div>
          <h1 className="text-xl font-semibold">{t.changePassword.title}</h1>
          <p className="mt-1 text-sm text-muted">{user.name}</p>
        </div>

        {user.mustChangePassword && (
          <p className="mb-4 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">{t.changePassword.requiredNotice}</p>
        )}

        <ChangePasswordForm />

        <div className="mt-4 text-center text-sm">
          {user.mustChangePassword ? (
            <form action={logout}>
              <button className="text-muted hover:text-danger">{t.nav.logout}</button>
            </form>
          ) : (
            <Link href="/" className="text-brand">← {t.nav.home}</Link>
          )}
        </div>
      </div>
    </main>
  );
}
