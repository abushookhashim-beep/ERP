import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { can, type Actor } from "./permissions";
import { descendantIds } from "./departments";
import { todayDate } from "./hr";

/**
 * نطاق الإصدار: الأدوار العليا لكل الشركة، ومدير الإدارة لإدارته وما يتبعها.
 * departmentIds فارغة مع full=false تعني لا صلاحية.
 */
export async function getPublishScope(user: Actor) {
  if (can(user, "circulars.publishAll")) return { full: true, departmentIds: [] as string[] };
  const headed = await db.department.findMany({ where: { headId: user.id }, select: { id: true } });
  if (headed.length === 0) return { full: false, departmentIds: [] };
  const all = await db.department.findMany({ select: { id: true, parentId: true, sortOrder: true, name: true } });
  const ids = new Set<string>();
  for (const d of headed) for (const id of descendantIds(all, d.id)) ids.add(id);
  return { full: false, departmentIds: [...ids] };
}

export const canPublish = (scope: Awaited<ReturnType<typeof getPublishScope>>) => scope.full || scope.departmentIds.length > 0;

export function hijriYear(date = new Date()) {
  const s = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { year: "numeric", timeZone: "Asia/Riyadh" }).format(date);
  return Number.parseInt(s, 10);
}

export const formatCircularNumber = (year: number, seq: number) => `${year}/${String(seq).padStart(3, "0")}`;

/** التعاميم السارية (غير المنتهية). */
export const activeWhere = (): Prisma.CircularWhereInput => ({
  OR: [{ expiresAt: null }, { expiresAt: { gte: todayDate() } }],
});

/** التعاميم التي يراها المستخدم. */
export function visibleWhere(user: Actor): Prisma.CircularWhereInput {
  if (can(user, "circulars.viewAll")) return {};
  return { OR: [{ issuerId: user.id }, { recipients: { some: { userId: user.id } } }] };
}

export function unreadCount(userId: string) {
  return db.circularRecipient.count({ where: { userId, readAt: null, circular: activeWhere() } });
}

export async function getCircularForUser(id: string, user: Actor) {
  const circular = await db.circular.findFirst({
    where: { id, ...visibleWhere(user) },
    include: {
      issuer: { select: { id: true, name: true, jobTitle: true } },
      departments: { include: { department: { select: { name: true } } } },
      attachments: { include: { file: { select: { id: true, name: true } } } },
      recipients: {
        include: { user: { select: { id: true, name: true, department: { select: { name: true } } } } },
        orderBy: { user: { name: "asc" } },
      },
    },
  });
  if (!circular) return null;
  const mine = circular.recipients.find((r) => r.userId === user.id) ?? null;
  const canTrack = circular.issuerId === user.id || can(user, "circulars.trackAll");
  return { circular, mine, canTrack };
}
