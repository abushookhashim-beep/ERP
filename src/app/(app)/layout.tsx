import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.mustChangePassword) redirect("/change-password");

  return (
    <div className="lg:flex">
      <Sidebar user={{ name: user.name, role: user.role, jobTitle: user.jobTitle }} />
      <main className="min-w-0 flex-1 p-4 lg:p-8">{children}</main>
    </div>
  );
}
