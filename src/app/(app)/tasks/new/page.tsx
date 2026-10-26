import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { riyadhDay } from "@/lib/meetings";
import { t } from "@/i18n";
import { TaskForm } from "./form";

export default async function NewTaskPage() {
  await requireUser();
  const people = await db.user.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, jobTitle: true },
  });
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/tasks" className="text-sm text-brand">← {t.tasks.back}</Link>
        <h1 className="mt-2 text-2xl font-semibold">{t.tasks.new}</h1>
      </div>
      <TaskForm people={people} today={riyadhDay(new Date())} />
    </div>
  );
}
