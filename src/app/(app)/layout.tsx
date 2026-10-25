import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { actionableStepsWhere } from "@/lib/requests";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.mustChangePassword) redirect("/change-password");
  const pendingApprovals = await db.approvalStep.count({ where: actionableStepsWhere(user) });

  return (
    <div className="lg:flex">
      <Sidebar user={{ name: user.name, role: user.role, jobTitle: user.jobTitle }} pendingApprovals={pendingApprovals} />
      <main className="min-w-0 flex-1 p-4 lg:p-8">{children}</main>
    </div>
  );
}
