import "server-only";
import type { Role } from "@prisma/client";
import { db } from "./db";

/** من يعالج تذاكر الدعم الفني. */
export const SUPPORT_ROLES: Role[] = ["IT", "ADMIN"];

export async function getTicketForUser(id: string, user: { id: string; role: Role }) {
  const ticket = await db.ticket.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, name: true, phone: true, department: { select: { name: true } } } },
      assignee: { select: { id: true, name: true } },
      attachment: { select: { id: true, name: true } },
      comments: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true } } } },
    },
  });
  if (!ticket) return null;
  const isSupport = SUPPORT_ROLES.includes(user.role);
  const isRequester = ticket.requesterId === user.id;
  if (!isSupport && !isRequester) return null;
  return { ticket, isSupport, isRequester };
}

export const formatTicketNumber = (n: number) => `TKT-${String(n).padStart(5, "0")}`;
