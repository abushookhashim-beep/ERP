"use client";

import { useActionState, useState } from "react";
import { saveProfile } from "../../actions";
import { t } from "@/i18n";

export type ProfileValues = Record<string, string>;

const f = t.hr.fields;
const MONEY = ["basicSalary", "housingAllowance", "transportAllowance", "otherAllowance"] as const;

export function ProfileForm({ userId, values, canEdit, showFinancial }: {
  userId: string; values: ProfileValues; canEdit: boolean; showFinancial: boolean;
}) {
  const [state, action, pending] = useActionState(saveProfile.bind(null, userId), undefined);
  const [money, setMoney] = useState(() => Object.fromEntries(MONEY.map((k) => [k, values[k] ?? ""])));
  const total = MONEY.reduce((sum, k) => sum + (Number(money[k].replace(/,/g, "")) || 0), 0);

  return (
    <form action={action} className="space-y-6">
      <fieldset disabled={!canEdit} className="space-y-6">
        <Section title={t.hr.sections.personal}>
          <Input name="nationality" label={f.nationality} values={values} />
          <Input name="birthDate" label={f.birthDate} type="date" values={values} />
          <Select name="gender" label={f.gender} options={t.hr.genders} values={values} />
          <Select name="maritalStatus" label={f.maritalStatus} options={t.hr.marital} values={values} />
          <Input name="emergencyName" label={f.emergencyName} values={values} />
          <Input name="emergencyPhone" label={f.emergencyPhone} type="tel" ltr values={values} />
        </Section>

        <Section title={t.hr.sections.contract}>
          <Input name="hireDate" label={f.hireDate} type="date" values={values} />
          <Select name="contractType" label={f.contractType} options={t.hr.contractTypes} values={values} />
          <Input name="contractEnd" label={f.contractEnd} type="date" values={values} />
          <Input name="probationEnd" label={f.probationEnd} type="date" values={values} />
          <Input name="workLocation" label={f.workLocation} values={values} />
          <div className="hidden sm:block" />
          <Input name="openingLeaveBalance" label={f.openingLeaveBalance} type="number" step="0.5" values={values} />
          <Input name="leaveBalanceAsOf" label={f.leaveBalanceAsOf} type="date" values={values} />
          <p className="text-xs text-muted sm:col-span-2">{f.openingHint}</p>
        </Section>

        {showFinancial && (
          <Section title={t.hr.sections.financial}>
            {MONEY.map((k) => (
              <div key={k}>
                <label className="label" htmlFor={k}>{f[k]} ({t.hr.currency})</label>
                <input id={k} name={k} inputMode="decimal" dir="ltr" value={money[k]}
                  onChange={(e) => setMoney({ ...money, [k]: e.target.value })} className="input" />
              </div>
            ))}
            <p className="rounded-lg bg-brand-soft px-3 py-2 text-sm sm:col-span-2">
              {f.totalSalary}: <strong className="tabular-nums">{total.toLocaleString("en-US")}</strong> {t.hr.currency}
            </p>
            <Input name="bankName" label={f.bankName} values={values} />
            <Input name="iban" label={f.iban} ltr values={values} />
            <Input name="gosiNumber" label={f.gosiNumber} ltr values={values} />
          </Section>
        )}
      </fieldset>

      {canEdit && (
        <div className="flex items-center gap-3">
          <button className="btn" disabled={pending}>{t.common.save}</button>
          {state?.ok && <p className="text-sm text-brand" role="status">{t.hr.saved}</p>}
          {state?.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}
        </div>
      )}
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h2 className="mb-4 font-semibold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Input({ name, label, type = "text", ltr, step, values }: {
  name: string; label: string; type?: string; ltr?: boolean; step?: string; values: ProfileValues;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} step={step} defaultValue={values[name] ?? ""} dir={ltr ? "ltr" : undefined} className="input" />
    </div>
  );
}

function Select({ name, label, options, values }: {
  name: string; label: string; options: Record<string, string>; values: ProfileValues;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <select id={name} name={name} defaultValue={values[name] ?? ""} className="input">
        <option value="">{t.common.none}</option>
        {Object.entries(options).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
