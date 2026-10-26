import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { HR_VIEW_ROLES } from "@/lib/hr";
import { getMeetingForUser } from "@/lib/meetings";
import { getVisibleRequest } from "@/lib/request-view";

/** يقدّم الملف المرفوع بعد التحقق من أن المستخدم مخوّل برؤيته. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });

  const file = await db.storedFile.findUnique({
    where: { id: (await params).id },
    include: { document: { select: { userId: true } }, request: { select: { id: true } }, meeting: { select: { meetingId: true } } },
  });
  if (!file) notFound();

  const allowed =
    (file.document && (file.document.userId === user.id || HR_VIEW_ROLES.includes(user.role))) ||
    (file.request && (await getVisibleRequest(file.request.id, user)) !== null) ||
    (file.meeting && (await getMeetingForUser(file.meeting.meetingId, user.id)) !== null);
  if (!allowed) notFound();

  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mime,
      "Content-Length": String(file.size),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
