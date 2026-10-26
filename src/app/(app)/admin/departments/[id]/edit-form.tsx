"use client";

import { updateDepartment } from "../actions";
import { t } from "@/i18n";
import { useFormAction } from "@/lib/use-form-action";

type Option = { id: string; name: string; depth?: number };
type Props = {
  department: { id: string; name: string; parentId: string | null; headId: string | null };
  parents: Option[];
  users: Option[];
};

export function EditDepartmentForm({ department, parents, users }: Props) {
  const [state, onSubmit, pending] = useFormAction(updateDepartment.bind(null, department.id));

  return (
    <form onSubmit={onSubmit} className="card max-w-xl space-y-4">
      <div>
        <label className="label" htmlFor="name">{t.departments.name}</label>
        <input id="name" name="name" required defaultValue={department.name} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="parentId">{t.departments.parent}</label>
        <select id="parentId" name="parentId" defaultValue={department.parentId ?? ""} className="input">
          <option value="">{t.common.none}</option>
          {parents.map((d) => <option key={d.id} value={d.id}>{"  ".repeat(d.depth ?? 0)}{d.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="headId">{t.departments.head}</label>
        <select id="headId" name="headId" defaultValue={department.headId ?? ""} className="input">
          <option value="">{t.common.none}</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button className="btn" disabled={pending}>{t.common.save}</button>
    </form>
  );
}
