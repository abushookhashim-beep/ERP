"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { InviteResponse, MeetingMode } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission, requireUser } from "@/lib/auth";
import { checkFile, storeFile, uploadedFile } from "@/lib/files";
import { isUniqueViolation, optional, type FormState } from "@/lib/form";
import { dateInput } from "@/lib/hr";
import { findConflicts, getMeetingForUser, riyadhDateTime } from "@/lib/meetings";
import { t } from "@/i18n";

const m = t.meetings;
export type MeetingFormState = { error?: string; warning?: string[] } | undefined;

const revalidateMeetings = (id?: string) => {
  revalidatePath("/meetings");
  revalidatePath("/tasks");
  revalidatePath("/");
  if (id) revalidatePath(`/meetings/${id}`);
};

export async function createMeeting(_: MeetingFormState, formData: FormData): Promise<MeetingFormState> {
  const user = await requireUser();
  const title = optional(formData.get("title"));
  const date = String(formData.get("date") ?? "");
  const startsAt = riyadhDateTime(date, String(formData.get("startTime") ?? ""));
  const endsAt = riyadhDateTime(date, String(formData.get("endTime") ?? ""));
  const mode = formData.get("mode") as MeetingMode;
  if (!title || !startsAt || !endsAt || !(mode in MeetingMode)) return { error: t.common.required };
  if (endsAt <= startsAt) return { error: m.endBeforeStart };

  const roomId = mode === "ONLINE" ? null : optional(formData.get("roomId"));
  const onlineUrl = mode === "IN_PERSON" ? null : optional(formData.get("onlineUrl"));
  if (mode !== "ONLINE" && !roomId) return { error: m.roomRequired };
  if (mode !== "IN_PERSON") {
    if (!onlineUrl) return { error: m.urlRequired };
    if (!/^https:\/\/\S+$/.test(onlineUrl)) return { error: m.invalidUrl };
  }

  const invitees = [...new Set(formData.getAll("invitees").map(String))].filter((id) => id !== user.id);
  if (invitees.length === 0) return { error: m.noInvitees };

  const files = formData.getAll("attachments").map(uploadedFile).filter((f): f is File => f !== null);
  for (const file of files) {
    const fileError = checkFile(file);
    if (fileError) return { error: `${file.name}: ${t.hr.files[fileError]}` };
  }

  const { roomMeeting, busy } = await findConflicts(startsAt, endsAt, roomId, [user.id, ...invitees]);
  if (roomMeeting) return { error: m.roomBusy(roomMeeting.title) };
  if (busy.length > 0 && formData.get("ignoreConflicts") !== "1") return { warning: busy };

  const fileIds = await Promise.all(files.map((f) => storeFile(f, user.id)));
  const meeting = await db.meeting.create({
    data: {
      title,
      startsAt,
      endsAt,
      mode,
      roomId,
      onlineUrl,
      agenda: optional(formData.get("agenda")),
      organizerId: user.id,
      secretaryId: optional(formData.get("secretaryId")),
      attendees: { createMany: { data: invitees.map((userId) => ({ userId })) } },
      attachments: { createMany: { data: fileIds.map((fileId) => ({ fileId })) } },
    },
  });
  revalidateMeetings();
  redirect(`/meetings/${meeting.id}`);
}

export async function respondToInvite(meetingId: string, response: InviteResponse, formData: FormData) {
  const user = await requireUser();
  await db.meetingAttendee.updateMany({
    where: { meetingId, userId: user.id, meeting: { status: "SCHEDULED" } },
    data: { response, responseNote: optional(formData.get("note")), respondedAt: new Date() },
  });
  revalidateMeetings(meetingId);
}

export async function cancelMeeting(meetingId: string) {
  const user = await requireUser();
  await db.meeting.updateMany({
    where: { id: meetingId, organizerId: user.id, status: "SCHEDULED" },
    data: { status: "CANCELLED" },
  });
  revalidateMeetings(meetingId);
}

export async function approveMinutes(meetingId: string, _: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const view = await getMeetingForUser(meetingId, user.id);
  if (!view?.canWriteMinutes || view.meeting.status !== "SCHEDULED") return { error: t.requests.notAllowed };
  if (view.meeting.startsAt > new Date()) return { error: m.minutes.tooEarly };

  const attended = new Set(formData.getAll("attended").map(String));
  const titles = formData.getAll("taskTitle").map(String);
  const assignees = formData.getAll("taskAssignee").map(String);
  const dues = formData.getAll("taskDue");
  const participants = new Set([view.meeting.organizerId, ...view.meeting.attendees.map((a) => a.userId)]);

  const tasks = titles
    .map((title, i) => ({ title: title.trim(), assigneeId: assignees[i], dueDate: dateInput(dues[i]) }))
    .filter((task) => task.title);
  if (tasks.some((task) => !task.assigneeId || !participants.has(task.assigneeId))) return { error: t.common.required };

  await db.$transaction([
    ...view.meeting.attendees.map((a) =>
      db.meetingAttendee.update({
        where: { meetingId_userId: { meetingId, userId: a.userId } },
        data: { attended: attended.has(a.userId) },
      })),
    db.task.createMany({ data: tasks.map((task) => ({ ...task, meetingId, createdById: user.id })) }),
    db.meeting.update({
      where: { id: meetingId },
      data: { status: "COMPLETED", minutes: optional(formData.get("minutes")), minutesApprovedAt: new Date() },
    }),
  ]);
  revalidateMeetings(meetingId);
  return { ok: true };
}

export async function createRoom(_: FormState, formData: FormData): Promise<FormState> {
  await requirePermission("admin.rooms");
  const name = optional(formData.get("name"));
  if (!name) return { error: t.common.required };
  const capacity = Number(formData.get("capacity")) || null;
  try {
    await db.meetingRoom.create({ data: { name, capacity } });
  } catch (e) {
    if (isUniqueViolation(e)) return { error: m.roomsAdmin.duplicate };
    throw e;
  }
  revalidatePath("/admin/rooms");
  return { ok: true };
}

export async function toggleRoom(formData: FormData) {
  await requirePermission("admin.rooms");
  const id = String(formData.get("id"));
  const room = await db.meetingRoom.findUniqueOrThrow({ where: { id } });
  await db.meetingRoom.update({ where: { id }, data: { active: !room.active } });
  revalidatePath("/admin/rooms");
}
