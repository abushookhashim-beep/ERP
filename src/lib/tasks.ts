import "server-only";
import { db } from "./db";

/** المهمة إذا كان المستخدم مسؤولاً عنها أو أسندها أو نظّم اجتماعها. */
export async function getTaskForUser(id: string, userId: string) {
  const task = await db.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      meeting: { select: { id: true, title: true, organizerId: true } },
      comments: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true } } } },
    },
  });
  if (!task) return null;
  const isAssignee = task.assigneeId === userId;
  const isCreator = task.createdById === userId || task.meeting?.organizerId === userId;
  if (!isAssignee && !isCreator) return null;
  return { task, isAssignee, isCreator };
}
