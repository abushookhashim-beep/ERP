import type { ApproverKind, Prisma, RequestType, Role, StepStatus } from "@prisma/client";
import { db } from "./db";

/** الأنواع الفرعية لكل نوع طلب. */
export const SUBTYPES = {
  LEAVE: ["ANNUAL", "SICK", "BEREAVEMENT", "MARRIAGE", "UNPAID"],
  LETTER: ["SALARY_INTRO", "SALARY_TRANSFER"],
  PLEDGE: ["UNDERTAKING", "CUSTODY"],
} as const satisfies Record<RequestType, readonly string[]>;

export type Subtype = (typeof SUBTYPES)[RequestType][number];

/** مسار التعميد لكل نوع طلب بالترتيب. */
export const APPROVAL_PATHS: Record<RequestType, ApproverKind[]> = {
  LEAVE: ["MANAGER", "HR", "CEO"],
  LETTER: ["HR"],
  PLEDGE: ["EMPLOYEE"],
};

/** من يستطيع إرسال تعهد أو عهدة لموظف. */
export const PLEDGE_SENDER_ROLES: Role[] = ["ADMIN", "HR", "IT"];

/** من يرى جميع الطلبات. */
export const ALL_REQUESTS_ROLES: Role[] = ["ADMIN", "HR", "EXECUTIVE"];

export const CEO_SETTING = "ceoUserId";

export async function getCeoId() {
  const setting = await db.setting.findUnique({ where: { key: CEO_SETTING } });
  return setting?.value ?? null;
}

/** عدد الأيام شاملاً يومي البداية والنهاية. */
export function inclusiveDays(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

/**
 * يبني خطوات التعميد للطلب. الخطوة التي لا معتمد لها، أو معتمدها هو صاحب الطلب، تُتخطى.
 * أول خطوة غير متخطاة تصبح PENDING والباقي WAITING.
 */
export async function buildSteps(type: RequestType, subject: { id: string; managerId: string | null }) {
  const ceoId = await getCeoId();
  let activated = false;

  return APPROVAL_PATHS[type].map((kind, order) => {
    const approverId =
      kind === "MANAGER" ? subject.managerId :
      kind === "CEO" ? ceoId :
      kind === "EMPLOYEE" ? subject.id :
      null;

    const skip =
      (kind === "MANAGER" && !approverId) ||
      (kind !== "EMPLOYEE" && approverId === subject.id);

    let status: StepStatus = "WAITING";
    if (skip) status = "SKIPPED";
    else if (!activated) {
      status = "PENDING";
      activated = true;
    }
    return { order, kind, approverId, status } satisfies Prisma.ApprovalStepCreateManyRequestInput;
  });
}

type StepForCheck = { kind: ApproverKind; approverId: string | null; status: StepStatus };
type Actor = { id: string; role: Role };

/** هل يستطيع المستخدم اتخاذ إجراء على هذه الخطوة؟ */
export function canActOnStep(step: StepForCheck, user: Actor, subjectId: string) {
  if (step.status !== "PENDING") return false;
  if (step.approverId) return step.approverId === user.id;
  // خطوة مفتوحة لمجموعة: لا يعتمد الموظف طلبه بنفسه
  if (user.id === subjectId) return false;
  if (step.kind === "HR") return user.role === "HR";
  if (step.kind === "CEO") return user.role === "EXECUTIVE";
  return false;
}

/** شرط Prisma لجلب الخطوات المعلقة التي يستطيع المستخدم اعتمادها. */
export function actionableStepsWhere(user: Actor): Prisma.ApprovalStepWhereInput {
  const pools: Prisma.ApprovalStepWhereInput[] = [];
  if (user.role === "HR") pools.push({ kind: "HR", approverId: null });
  if (user.role === "EXECUTIVE") pools.push({ kind: "CEO", approverId: null });

  return {
    status: "PENDING",
    request: { status: "PENDING" },
    OR: [
      { approverId: user.id },
      ...(pools.length ? [{ AND: [{ OR: pools }, { request: { subjectId: { not: user.id } } }] }] : []),
    ],
  };
}

export function formatRequestNumber(n: number) {
  return `REQ-${String(n).padStart(5, "0")}`;
}
