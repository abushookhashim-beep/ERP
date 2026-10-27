"use client";

import { useState, useTransition } from "react";
import { Lock } from "lucide-react";
import { deleteRole, saveRole } from "./actions";
import { useFormAction } from "@/lib/use-form-action";
import { ADMIN_LOCKED, ADMIN_ROLE_ID, PERMISSION_GROUPS, type Permission } from "@/lib/permissions";
import { t } from "@/i18n";

type Props = {
  role: { id: string; name: string; description: string | null; permissions: string[]; system: boolean } | null;
  canDelete: boolean;
};

export function RoleForm({ role, canDelete }: Props) {
  const [state, onSubmit, pending] = useFormAction(saveRole.bind(null, role?.id ?? null));
  const [checked, setChecked] = useState(() => new Set(role?.permissions ?? []));
  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string>();
  const locked = (p: Permission) => role?.id === ADMIN_ROLE_ID && ADMIN_LOCKED.includes(p);

  const toggle = (perms: readonly Permission[], on: boolean) =>
    setChecked((cur) => {
      const next = new Set(cur);
      for (const p of perms) {
        if (locked(p)) continue;
        if (on) next.add(p);
        else next.delete(p);
      }
      return next;
    });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="card grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">{t.roles.name}</label>
          <input id="name" name="name" required defaultValue={role?.name} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="description">{t.roles.description}</label>
          <input id="description" name="description" defaultValue={role?.description ?? ""} className="input" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">{t.roles.permissions}</h2>
        <p className="text-sm text-muted">{t.roles.base}</p>
        <div className="grid gap-4 md:grid-cols-2">
          {PERMISSION_GROUPS.map((g) => {
            const all = g.permissions.every((p) => checked.has(p));
            return (
              <fieldset key={g.key} className="card space-y-2">
                <legend className="sr-only">{t.roles.groups[g.key]}</legend>
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="font-semibold">{t.roles.groups[g.key]}</span>
                  {g.permissions.length > 1 && (
                    <label className="flex items-center gap-2 text-xs text-muted">
                      <input type="checkbox" checked={all} onChange={(e) => toggle(g.permissions, e.target.checked)} className="accent-[var(--brand)]" />
                      {t.roles.selectAll}
                    </label>
                  )}
                </div>
                {g.permissions.map((p) => (
                  <label key={p} className="flex items-start gap-2 text-sm" title={locked(p) ? t.roles.locked : undefined}>
                    <input type="checkbox" name="permissions" value={p} checked={checked.has(p)} disabled={locked(p)}
                      onChange={(e) => toggle([p], e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--brand)]" />
                    <span>{t.roles.perms[p]}{locked(p) && <Lock size={12} className="ms-1 inline text-muted" />}</span>
                    {/* الحقل المعطّل لا يُرسل، فنرسل الصلاحية المقفلة مخفية */}
                    {locked(p) && <input type="hidden" name="permissions" value={p} />}
                  </label>
                ))}
              </fieldset>
            );
          })}
        </div>
      </section>

      {state?.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
      {deleteError && <p className="text-sm text-danger" role="alert">{deleteError}</p>}
      <div className="flex flex-wrap gap-2">
        <button className="btn" disabled={pending}>{t.common.save}</button>
        {role && canDelete && (
          <button type="button" disabled={deleting} className="btn-ghost px-4 py-2 text-danger"
            onClick={() => confirm(t.roles.confirmDelete) && startDelete(async () => {
              const r = await deleteRole(role.id);
              if (r?.error) setDeleteError(r.error);
            })}>
            {t.roles.delete}
          </button>
        )}
      </div>
    </form>
  );
}
