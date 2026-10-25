"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2, CalendarDays, CheckSquare, FileText, Home, KeyRound, LogOut, Megaphone, Menu,
  Users, Wallet, X, Briefcase, Workflow,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { logout } from "@/app/login/actions";
import { t } from "@/i18n";

const NAV = [
  { href: "/", label: t.nav.home, icon: Home },
  { href: "/requests", label: t.nav.requests, icon: FileText },
  { href: "/approvals", label: t.nav.approvals, icon: CheckSquare },
  { href: "/circulars", label: t.nav.circulars, icon: Megaphone },
  { href: "/meetings", label: t.nav.meetings, icon: CalendarDays },
  { href: "/hr", label: t.nav.hr, icon: Briefcase, roles: ["ADMIN", "HR", "EXECUTIVE"] },
  { href: "/finance", label: t.nav.finance, icon: Wallet, roles: ["ADMIN", "FINANCE", "EXECUTIVE"] },
] satisfies { href: string; label: string; icon: unknown; roles?: Role[] }[];

const ADMIN_NAV = [
  { href: "/admin/users", label: t.nav.users, icon: Users },
  { href: "/admin/departments", label: t.nav.departments, icon: Building2 },
  { href: "/admin/approval-settings", label: t.nav.approvalSettings, icon: Workflow },
];

type Props = { user: { name: string; role: Role; jobTitle: string | null }; pendingApprovals: number };

export function Sidebar({ user, pendingApprovals }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const link = (item: { href: string; label: string; icon: typeof Home }) => (
    <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
        isActive(item.href) ? "bg-brand-soft font-semibold text-brand" : "text-foreground hover:bg-brand-soft"
      }`}>
      <item.icon size={18} />
      {item.label}
      {item.href === "/approvals" && pendingApprovals > 0 && (
        <span className="ms-auto rounded-full bg-accent px-2 text-xs font-semibold text-white">{pendingApprovals}</span>
      )}
    </Link>
  );

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <span className="font-semibold">{t.appName}</span>
        <button onClick={() => setOpen(!open)} aria-label="menu" className="btn-ghost">
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      <aside className={`${open ? "block" : "hidden"} fixed inset-y-0 start-0 z-30 w-64 border-e border-border bg-surface lg:sticky lg:top-0 lg:block lg:h-screen`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">ERP</div>
            <div>
              <p className="text-sm font-semibold">{t.appName}</p>
              <p className="text-xs text-muted">{t.appTagline}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {NAV.filter((i) => !("roles" in i) || (i.roles as Role[]).includes(user.role)).map(link)}
            {user.role === "ADMIN" && (
              <>
                <p className="px-3 pb-1 pt-4 text-xs font-medium text-muted">{t.nav.admin}</p>
                {ADMIN_NAV.map(link)}
              </>
            )}
          </nav>

          <div className="border-t border-border p-3">
            <div className="px-3 pb-2">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted">{user.jobTitle ?? t.roles[user.role]}</p>
            </div>
            <Link href="/change-password" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-brand-soft">
              <KeyRound size={18} />
              {t.changePassword.nav}
            </Link>
            <form action={logout}>
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-danger hover:bg-brand-soft">
                <LogOut size={18} />
                {t.nav.logout}
              </button>
            </form>
          </div>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
