import "server-only";
import type { EmployeeProfile } from "@prisma/client";
import { db } from "./db";
import { DAY_MS, todayDate } from "./hr";

export type LeavePolicy = {
  annualDays: number;           // الإجازة السنوية للسنوات الخمس الأولى
  annualDaysAfter5Years: number; // بعد إكمال خمس سنوات خدمة
  marriageDays: number;
  bereavementDays: number;
  sickDaysPerYear: number;
  alertDays: number;            // التنبيه قبل انتهاء المستندات والعقود
};

// الحد الأدنى في نظام العمل السعودي؛ قابلة للتعديل من إعدادات الموارد البشرية
export const DEFAULT_LEAVE_POLICY: LeavePolicy = {
  annualDays: 21,
  annualDaysAfter5Years: 30,
  marriageDays: 5,
  bereavementDays: 5,
  sickDaysPerYear: 120,
  alertDays: 60,
};

export const LEAVE_POLICY_SETTING = "leavePolicy";

export async function getLeavePolicy(): Promise<LeavePolicy> {
  const setting = await db.setting.findUnique({ where: { key: LEAVE_POLICY_SETTING } });
  return { ...DEFAULT_LEAVE_POLICY, ...(setting ? JSON.parse(setting.value) : {}) };
}

type ProfileForBalance = Pick<EmployeeProfile, "hireDate" | "openingLeaveBalance" | "leaveBalanceAsOf"> | null;

export type AnnualBalance = {
  accrued: number;
  used: number;
  available: number;
  entitlement: number; // الاستحقاق السنوي الحالي (21 أو 30)
};

/**
 * رصيد الإجازة السنوية: الرصيد الافتتاحي + الاستحقاق اليومي منذ تاريخه (أو منذ المباشرة)
 * ناقص الإجازات السنوية المعتمدة والمعلقة. null إذا لم يُحدد تاريخ البداية.
 */
export async function getAnnualBalance(userId: string, profile: ProfileForBalance, policy: LeavePolicy): Promise<AnnualBalance | null> {
  const start = profile?.leaveBalanceAsOf ?? profile?.hireDate;
  if (!start) return null;
  const today = todayDate();

  const fiveYears = profile?.hireDate
    ? new Date(Date.UTC(profile.hireDate.getUTCFullYear() + 5, profile.hireDate.getUTCMonth(), profile.hireDate.getUTCDate()))
    : null;
  const daysBetween = (a: Date, b: Date) => Math.max(0, (b.getTime() - a.getTime()) / DAY_MS);

  let accrued = Number(profile?.openingLeaveBalance ?? 0);
  if (fiveYears && fiveYears < today) {
    const switchAt = fiveYears > start ? fiveYears : start;
    accrued += daysBetween(start, switchAt) * policy.annualDays / 365;
    accrued += daysBetween(switchAt, today) * policy.annualDaysAfter5Years / 365;
  } else {
    accrued += daysBetween(start, today) * policy.annualDays / 365;
  }

  // مع الرصيد الافتتاحي تُخصم فقط الطلبات المقدمة بعد تاريخه، لأن ما قبله محسوب ضمنه
  const used = await db.request.aggregate({
    where: {
      subjectId: userId, type: "LEAVE", subtype: "ANNUAL", status: { in: ["APPROVED", "PENDING"] },
      ...(profile?.leaveBalanceAsOf && { createdAt: { gte: profile.leaveBalanceAsOf } }),
    },
    _sum: { days: true },
  });
  const usedDays = used._sum.days ?? 0;
  const round = (n: number) => Math.floor(n * 10) / 10;

  return {
    accrued: round(accrued),
    used: usedDays,
    available: round(accrued - usedDays),
    entitlement: fiveYears && fiveYears <= today ? policy.annualDaysAfter5Years : policy.annualDays,
  };
}

/** أيام الإجازة المرضية المعتمدة والمعلقة في سنة ميلادية. */
export async function getSickDaysInYear(userId: string, year: number) {
  const result = await db.request.aggregate({
    where: {
      subjectId: userId, type: "LEAVE", subtype: "SICK", status: { in: ["APPROVED", "PENDING"] },
      startDate: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) },
    },
    _sum: { days: true },
  });
  return result._sum.days ?? 0;
}
