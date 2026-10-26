"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Priority, TaskStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { optional, type FormState } from "@/lib/form";
import { dateInput } from "@/lib/hr";
import { getTaskForUser } from "@/lib/tasks";
import { t } from "@/i18n";

const revalidateTasks = (id?: string) => {
  revalidatePath("/tasks");
  revalidatePath("/");
  if (id) revalidatePath(`/tasks/${id}`);
};

export async function createTask(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const title = optional(formData.get("title"));
  const assigneeId = optional(formData.get("assigneeId"));
  const priority = formData.get("priority") as Priority;
  if (!title || !assigneeId || !(priority in Priority)) return { error: t.common.required };
  const assignee = await db.user.findUnique({ where: { id: assigneeId, active: true }, select: { id: true } });
  if (!assignee) return { error: t.common.required };

  const task = await db.task.create({
    data: {
      title,
      description: optional(formData.get("description")),
      assigneeId,
      priority,
      dueDate: dateInput(formData.get("dueDate")),
      createdById: user.id,
    },
  });
  revalidateTasks();
  redirect(`/tasks/${task.id}`);
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const user = await requireUser();
  const view = await getTaskForUser(taskId, user.id);
  if (!view || view.task.status === status) return;
  await db.$transaction([
    db.task.update({ where: { id: taskId }, data: { status, completedAt: status === "DONE" ? new Date() : null } }),
    db.comment.create({ data: { taskId, authorId: user.id, isSystem: true, body: t.tasks.statusChanged(t.tasks.status[status]) } }),
  ]);
  revalidateTasks(taskId);
  if (view.task.meetingId) revalidatePath(`/meetings/${view.task.meetingId}`);
}

export async function addTaskComment(taskId: string, _: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const body = optional(formData.get("body"));
  if (!body) return { error: t.common.required };
  if (!(await getTaskForUser(taskId, user.id))) return { error: t.requests.notAllowed };
  await db.comment.create({ data: { taskId, authorId: user.id, body } });
  revalidatePath(`/tasks/${taskId}`);
  return { ok: true };
}
