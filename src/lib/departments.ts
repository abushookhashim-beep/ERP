type Node = { id: string; parentId: string | null; sortOrder: number; name: string };

/** يرتب الإدارات كشجرة (الأب ثم أبناؤه) ويضيف عمق كل إدارة للعرض. */
export function toTree<T extends Node>(departments: T[]) {
  const byParent = new Map<string | null, T[]>();
  for (const d of departments) {
    const siblings = byParent.get(d.parentId) ?? [];
    siblings.push(d);
    byParent.set(d.parentId, siblings);
  }
  const result: (T & { depth: number })[] = [];
  const walk = (parentId: string | null, depth: number) => {
    const children = (byParent.get(parentId) ?? []).sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ar"),
    );
    for (const child of children) {
      result.push({ ...child, depth });
      walk(child.id, depth + 1);
    }
  };
  walk(null, 0);
  return result;
}

/** معرّفات الإدارة وكل ما يتبع لها (لمنع جعل الإدارة تابعة لنفسها). */
export function descendantIds(departments: Node[], rootId: string) {
  const ids = new Set([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const d of departments) {
      if (d.parentId && ids.has(d.parentId) && !ids.has(d.id)) {
        ids.add(d.id);
        added = true;
      }
    }
  }
  return ids;
}
