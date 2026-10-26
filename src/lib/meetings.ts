import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";

// السعودية على UTC+3 طوال العام (بدون توقيت صيفي)
const RIYADH_OFFSET = "+03:00";
const RIYADH_MS = 3 * 3_600_000;

/** يجمع حقلي التاريخ والوقت من النموذج إلى لحظة زمنية بتوقيت الرياض. */
export function riyadhDateTime(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const d = new Date(`${date}T${time}:00${RIYADH_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** تاريخ اليوم (YYYY-MM-DD) بتوقيت الرياض للحظة معينة. */
export function riyadhDay(d: Date) {
  return new Date(d.getTime() + RIYADH_MS).toISOString().slice(0, 10);
}

/** بداية ونهاية يوم بتوقيت الرياض. */
export function riyadhDayRange(day: string) {
  const start = new Date(`${day}T00:00:00${RIYADH_OFFSET}`);
  return { start, end: new Date(start.getTime() + 86_400_000) };
}

/** الاجتماعات التي يشارك فيها المستخدم (منظماً أو أميناً أو مدعواً). */
export function participatesWhere(userId: string): Prisma.MeetingWhereInput {
  return { OR: [{ organizerId: userId }, { secretaryId: userId }, { attendees: { some: { userId } } }] };
}

/** شرط التداخل الزمني مع فترة. */
export const overlaps = (startsAt: Date, endsAt: Date): Prisma.MeetingWhereInput => ({
  status: "SCHEDULED",
  startsAt: { lt: endsAt },
  endsAt: { gt: startsAt },
});

export async function findConflicts(startsAt: Date, endsAt: Date, roomId: string | null, userIds: string[]) {
  const [roomMeeting, busy] = await Promise.all([
    roomId ? db.meeting.findFirst({ where: { roomId, ...overlaps(startsAt, endsAt) }, select: { title: true } }) : null,
    db.meetingAttendee.findMany({
      where: { userId: { in: userIds }, response: { not: "DECLINED" }, meeting: overlaps(startsAt, endsAt) },
      select: { user: { select: { name: true } }, meeting: { select: { title: true } } },
    }),
  ]);
  return { roomMeeting, busy: busy.map((b) => `${b.user.name} (${b.meeting.title})`) };
}

export async function getMeetingForUser(id: string, userId: string) {
  const meeting = await db.meeting.findUnique({
    where: { id },
    include: {
      room: true,
      organizer: { select: { id: true, name: true } },
      secretary: { select: { id: true, name: true } },
      attendees: {
        include: { user: { select: { id: true, name: true, jobTitle: true, department: { select: { name: true } } } } },
        orderBy: { user: { name: "asc" } },
      },
      tasks: { include: { assignee: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
      attachments: { include: { file: { select: { id: true, name: true } } } },
    },
  });
  if (!meeting) return null;
  const isOrganizer = meeting.organizerId === userId;
  const isSecretary = meeting.secretaryId === userId;
  const invite = meeting.attendees.find((a) => a.userId === userId);
  if (!isOrganizer && !isSecretary && !invite) return null;
  return { meeting, isOrganizer, canWriteMinutes: isOrganizer || isSecretary, invite };
}
