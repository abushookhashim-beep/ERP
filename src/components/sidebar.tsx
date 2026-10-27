"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2, CalendarDays, CheckSquare, FileText, Home, KeyRound, LogOut, Megaphone, Menu,
  Users, Wallet, X, Briefcase, Workflow, UserRound, ListTodo, DoorOpen, LifeBuoy, ShieldCheck,
} from "lucide-react";
import { logout } from "@/app/login/actions";
import type { Permission } from "@/lib/permissions";
import { t } from "@/i18n";

type NavItem = { href: string; label: string; icon: typeof Home; perm?: Permission };

const NAV = [
  { href: "/", label: t.nav.home, icon: Home },
  { href: "/profile", label: t.nav.profile, icon: UserRound },
  { href: "/requests", label: t.nav.requests, icon: FileText },
  { href: "/approvals", label: t.nav.approvals, icon: CheckSquare },
  { href: "/circulars", label: t.nav.circulars, icon: Megaphone },
  { href: "/meetings", label: t.nav.meetings, icon: CalendarDays },
  { href: "/tasks", label: t.nav.tasks, icon: ListTodo },
  { href: "/support", label: t.nav.support, icon: LifeBuoy },
  { href: "/hr", label: t.nav.hr, icon: Briefcase, perm: "hr.view" },
  { href: "/finance", label: t.nav.finance, icon: Wallet, perm: "finance.view" },
] satisfies NavItem[];

const ADMIN_NAV = [
  { href: "/admin/users", label: t.nav.users, icon: Users, perm: "admin.users" },
  { href: "/admin/roles", label: t.nav.roles, icon: ShieldCheck, perm: "admin.roles" },
  { href: "/admin/departments", label: t.nav.departments, icon: Building2, perm: "admin.departments" },
  { href: "/admin/approval-settings", label: t.nav.approvalSettings, icon: Workflow, perm: "admin.approvalSettings" },
  { href: "/admin/rooms", label: t.nav.rooms, icon: DoorOpen, perm: "admin.rooms" },
] satisfies NavItem[];

type Badges = Partial<Record<string, number>>;
type Props = { user: { name: string; roleName: string; jobTitle: string | null; permissions: string[] }; badges: Badges };

export function Sidebar({ user, badges }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const allowed = (i: NavItem) => !i.perm || user.permissions.includes(i.perm);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const link = (item: { href: string; label: string; icon: typeof Home }) => (
    <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
        isActive(item.href) ? "bg-brand-soft font-semibold text-brand" : "text-foreground hover:bg-brand-soft"
      }`}>
      <item.icon size={18} />
      {item.label}
      {!!badges[item.href] && (
        <span className="ms-auto rounded-full bg-accent px-2 text-xs font-semibold text-white">{badges[item.href]}</span>
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
            {NAV.filter(allowed).map(link)}
            {ADMIN_NAV.some(allowed) && (
              <>
                <p className="px-3 pb-1 pt-4 text-xs font-medium text-muted">{t.nav.admin}</p>
                {ADMIN_NAV.filter(allowed).map(link)}
              </>
            )}
          </nav>

          <div className="border-t border-border p-3">
            <div className="px-3 pb-2">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted">{user.jobTitle ?? user.roleName}</p>
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
