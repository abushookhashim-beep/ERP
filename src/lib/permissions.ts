// فهرس الصلاحيات. الأدوار تُدار من صفحة «الأدوار والصلاحيات»، وكل دور مجموعة من هذه المفاتيح.
// الإضافة هنا تكفي لظهور الصلاحية في صفحة الأدوار؛ ثم تُفحص في الكود بـ can().

export const PERMISSION_GROUPS = [
  { key: "admin", permissions: ["admin.users", "admin.roles", "admin.departments", "admin.approvalSettings", "admin.rooms"] },
  { key: "dashboard", permissions: ["dashboard.view"] },
  { key: "requests", permissions: ["requests.viewAll", "requests.approveHr", "requests.approveExecutive", "requests.sendPledge"] },
  { key: "hr", permissions: ["hr.view", "hr.edit", "hr.policy"] },
  { key: "support", permissions: ["support.manage"] },
  { key: "circulars", permissions: ["circulars.publishAll", "circulars.viewAll", "circulars.trackAll"] },
  { key: "finance", permissions: ["finance.view"] },
] as const;

export type Permission = (typeof PERMISSION_GROUPS)[number]["permissions"][number];

export const ALL_PERMISSIONS: Permission[] = PERMISSION_GROUPS.flatMap((g) => g.permissions);

export const isPermission = (p: string): p is Permission => (ALL_PERMISSIONS as string[]).includes(p);

/** دور مدير النظام الأساسي لا يمكن أن يفقد هاتين الصلاحيتين حتى لا يُقفل النظام. */
export const ADMIN_ROLE_ID = "role_admin";
export const ADMIN_LOCKED: Permission[] = ["admin.users", "admin.roles"];
export const DEFAULT_ROLE_ID = "role_employee";

export type Actor = { id: string; permissions: readonly string[] };

export const can = (user: Actor, permission: Permission) => user.permissions.includes(permission);
