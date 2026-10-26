"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Priority, TicketCategory, TicketStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { checkFile, storeFile, uploadedFile } from "@/lib/files";
import { optional, type FormState } from "@/lib/form";
import { SUPPORT_ROLES, getTicketForUser } from "@/lib/support";
import { t } from "@/i18n";

const s = t.support;

const revalidateTicket = (id?: string) => {
  revalidatePath("/support");
  revalidatePath("/", "layout");
  if (id) revalidatePath(`/support/${id}`);
};

export async function createTicket(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const title = optional(formData.get("title"));
  const description = optional(formData.get("description"));
  const category = formData.get("category") as TicketCategory;
  const priority = formData.get("priority") as Priority;
  if (!title || !description || !(category in TicketCategory) || !(priority in Priority)) return { error: t.common.required };

  const file = uploadedFile(formData.get("attachment"));
  if (file) {
    const fileError = checkFile(file);
    if (fileError) return { error: t.hr.files[fileError] };
  }

  const ticket = await db.ticket.create({
    data: {
      title, description, category, priority, requesterId: user.id,
      ...(file && { attachmentId: await storeFile(file, user.id) }),
    },
  });
  revalidateTicket();
  redirect(`/support/${ticket.id}`);
}

export async function addTicketComment(ticketId: string, _: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const body = optional(formData.get("body"));
  if (!body) return { error: t.common.required };
  const view = await getTicketForUser(ticketId, user);
  if (!view || view.ticket.status === "CLOSED") return { error: t.requests.notAllowed };

  await db.$transaction([
    db.comment.create({ data: { ticketId, authorId: user.id, body } }),
    // رد الموظف على طلب معلومات يعيد التذكرة للفني
    ...(view.isRequester && view.ticket.status === "WAITING_USER"
      ? [db.ticket.update({ where: { id: ticketId }, data: { status: "IN_PROGRESS" } })]
      : []),
  ]);
  revalidateTicket(ticketId);
  return { ok: true };
}

/** تحديث الفني لحالة التذكرة أو إسنادها. */
export async function manageTicket(ticketId: string, _: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const view = await getTicketForUser(ticketId, user);
  if (!view?.isSupport) return { error: t.requests.notAllowed };
  const { ticket } = view;

  const status = (formData.get("status") as TicketStatus) || ticket.status;
  const assigneeId = formData.has("assigneeId") ? optional(formData.get("assigneeId")) : ticket.assigneeId;
  if (!(status in TicketStatus)) return { error: t.common.required };
  if (assigneeId && !(await db.user.findFirst({ where: { id: assigneeId, active: true, role: { in: SUPPORT_ROLES } } }))) {
    return { error: t.common.required };
  }

  const logs: string[] = [];
  if (status !== ticket.status) logs.push(s.statusChanged(s.statusForIt[status]));
  if (assigneeId !== ticket.assigneeId && assigneeId) {
    const assignee = await db.user.findUniqueOrThrow({ where: { id: assigneeId }, select: { name: true } });
    logs.push(s.assigned(assignee.name));
  }
  if (logs.length === 0) return { ok: true };

  // استلام تذكرة جديدة ينقلها تلقائياً إلى قيد المعالجة
  const finalStatus = status === "NEW" && assigneeId ? "IN_PROGRESS" : status;
  await db.$transaction([
    db.ticket.update({
      where: { id: ticketId },
      data: {
        status: finalStatus,
        assigneeId,
        resolvedAt: finalStatus === "RESOLVED" || finalStatus === "CLOSED" ? new Date() : null,
      },
    }),
    db.comment.createMany({ data: logs.map((body) => ({ ticketId, authorId: user.id, body, isSystem: true })) }),
  ]);
  revalidateTicket(ticketId);
  return { ok: true };
}

/** الموظف يؤكد الحل أو يعيد الفتح بعد أن يعلّمها الفني محلولة. */
export async function respondToResolution(ticketId: string, accept: boolean, _: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const view = await getTicketForUser(ticketId, user);
  if (!view?.isRequester || view.ticket.status !== "RESOLVED") return { error: t.requests.notAllowed };
  const note = optional(formData.get("body"));

  await db.$transaction([
    db.ticket.update({ where: { id: ticketId }, data: accept ? { status: "CLOSED" } : { status: "IN_PROGRESS", resolvedAt: null } }),
    db.comment.create({ data: { ticketId, authorId: user.id, isSystem: true, body: accept ? s.closedByUser : s.reopened } }),
    ...(note ? [db.comment.create({ data: { ticketId, authorId: user.id, body: note } })] : []),
  ]);
  revalidateTicket(ticketId);
  return { ok: true };
}
