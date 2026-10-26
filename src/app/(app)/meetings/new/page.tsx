import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { toTree } from "@/lib/departments";
import { ACCEPT_ATTR } from "@/lib/files";
import { riyadhDay } from "@/lib/meetings";
import { t } from "@/i18n";
import { MeetingForm } from "./form";

export default async function NewMeetingPage() {
  const user = await requireUser();
  const [people, departments, rooms] = await Promise.all([
    db.user.findMany({
      where: { active: true, NOT: { id: user.id } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, departmentId: true, jobTitle: true },
    }),
    db.department.findMany({ select: { id: true, name: true, parentId: true, sortOrder: true } }),
    db.meetingRoom.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, capacity: true } }),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/meetings" className="text-sm text-brand">← {t.meetings.back}</Link>
        <h1 className="mt-2 text-2xl font-semibold">{t.meetings.new}</h1>
      </div>
      <MeetingForm
        people={people}
        departments={toTree(departments).map(({ id, name, depth }) => ({ id, name, depth }))}
        rooms={rooms}
        accept={ACCEPT_ATTR}
        today={riyadhDay(new Date())}
      />
    </div>
  );
}
