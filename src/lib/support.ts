import "server-only";
import { db } from "./db";
import { can, type Actor } from "./permissions";

/** الفريق الذي يعالج التذاكر: كل من يملك صلاحية support.manage. */
export const supportTeamWhere = { active: true, role: { permissions: { has: "support.manage" } } };

export async function getTicketForUser(id: string, user: Actor) {
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
  const isSupport = can(user, "support.manage");
  const isRequester = ticket.requesterId === user.id;
  if (!isSupport && !isRequester) return null;
  return { ticket, isSupport, isRequester };
}

export const formatTicketNumber = (n: number) => `TKT-${String(n).padStart(5, "0")}`;
