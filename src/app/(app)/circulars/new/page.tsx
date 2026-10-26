import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canPublish, getPublishScope } from "@/lib/circulars";
import { toTree } from "@/lib/departments";
import { ACCEPT_ATTR } from "@/lib/files";
import { t } from "@/i18n";
import { CircularForm } from "./form";

export default async function NewCircularPage() {
  const user = await requireUser();
  const scope = await getPublishScope(user);
  if (!canPublish(scope)) redirect("/circulars");

  const [people, departments] = await Promise.all([
    scope.full
      ? db.user.findMany({ where: { active: true, NOT: { id: user.id } }, orderBy: { name: "asc" }, select: { id: true, name: true, departmentId: true, jobTitle: true } })
      : [],
    db.department.findMany({ select: { id: true, name: true, parentId: true, sortOrder: true } }),
  ]);
  const tree = toTree(departments)
    .filter((d) => scope.full || scope.departmentIds.includes(d.id))
    .map(({ id, name, depth }) => ({ id, name, depth }));
  // عمق شجرة النطاق المحدود يبدأ من إدارة المدير
  const minDepth = Math.min(...tree.map((d) => d.depth));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/circulars" className="text-sm text-brand">← {t.circulars.back}</Link>
        <h1 className="mt-2 text-2xl font-semibold">{t.circulars.new}</h1>
      </div>
      <CircularForm
        full={scope.full}
        people={people}
        departments={tree.map((d) => ({ ...d, depth: d.depth - minDepth }))}
        accept={ACCEPT_ATTR}
      />
    </div>
  );
}
