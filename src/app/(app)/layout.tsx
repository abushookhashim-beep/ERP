import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { actionableStepsWhere } from "@/lib/requests";
import { SUPPORT_ROLES } from "@/lib/support";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.mustChangePassword) redirect("/change-password");
  const now = new Date();
  const [approvals, invites, tasks, tickets] = await Promise.all([
    db.approvalStep.count({ where: actionableStepsWhere(user) }),
    db.meetingAttendee.count({ where: { userId: user.id, response: "PENDING", meeting: { status: "SCHEDULED", endsAt: { gt: now } } } }),
    db.task.count({ where: { assigneeId: user.id, status: { not: "DONE" } } }),
    // للفنيين: التذاكر الجديدة. للموظف: تذاكره التي تنتظر رده
    db.ticket.count({
      where: SUPPORT_ROLES.includes(user.role)
        ? { status: "NEW" }
        : { requesterId: user.id, status: { in: ["WAITING_USER", "RESOLVED"] } },
    }),
  ]);

  return (
    <div className="lg:flex">
      <Sidebar user={{ name: user.name, role: user.role, jobTitle: user.jobTitle }} badges={{ "/approvals": approvals, "/meetings": invites, "/tasks": tasks, "/support": tickets }} />
      <main className="min-w-0 flex-1 p-4 lg:p-8">{children}</main>
    </div>
  );
}
