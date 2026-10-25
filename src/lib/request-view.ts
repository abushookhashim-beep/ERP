import "server-only";
import type { Role } from "@prisma/client";
import { db } from "./db";
import { ALL_REQUESTS_ROLES, canActOnStep } from "./requests";

export type RequestDetails = {
  addressedTo?: string; bankName?: string; iban?: string;
  pledgeTitle?: string; pledgeBody?: string; items?: string[];
};

/** يجلب الطلب إذا كان المستخدم مخولاً برؤيته، مع معرفة هل يستطيع اتخاذ إجراء عليه. */
export async function getVisibleRequest(id: string, user: { id: string; role: Role }) {
  const request = await db.request.findUnique({
    where: { id },
    include: {
      subject: { select: { name: true, employeeNo: true, jobTitle: true, department: { select: { name: true } } } },
      createdBy: { select: { name: true } },
      steps: {
        orderBy: { order: "asc" },
        include: { approver: { select: { name: true } }, actedBy: { select: { name: true } } },
      },
    },
  });
  if (!request) return null;

  const currentStep = request.steps.find((s) => s.status === "PENDING");
  const canAct = request.status === "PENDING" && !!currentStep && canActOnStep(currentStep, user, request.subjectId);
  const involved =
    request.subjectId === user.id ||
    request.createdById === user.id ||
    request.steps.some((s) => s.approverId === user.id) ||
    ALL_REQUESTS_ROLES.includes(user.role);
  if (!involved && !canAct) return null;

  return { request, canAct, details: request.details as RequestDetails };
}
