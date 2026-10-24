import { CalendarDays, CheckSquare, FileText, Megaphone } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { t } from "@/i18n";

const WIDGETS = [
  { title: t.home.myRequests, icon: FileText },
  { title: t.home.pendingApprovals, icon: CheckSquare },
  { title: t.home.latestCirculars, icon: Megaphone },
  { title: t.home.todayMeetings, icon: CalendarDays },
];

export default async function HomePage() {
  const user = await requireUser();
  const today = new Intl.DateTimeFormat("ar-SA", { dateStyle: "full" }).format(new Date());

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">{t.home.greeting}، {user.name.split(" ")[0]} 👋</h1>
        <p className="mt-1 text-sm text-muted">{today}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {WIDGETS.map((w) => (
          <section key={w.title} className="card">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <w.icon size={18} className="text-brand" />
              {w.title}
            </h2>
            <p className="py-6 text-center text-sm text-muted">{t.home.empty}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
