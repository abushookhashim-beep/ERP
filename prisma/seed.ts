import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ORG_STRUCTURE, type OrgUnit } from "./org-structure";

const prisma = new PrismaClient();

/** ينشئ الإدارات غير الموجودة فقط، ولا يغيّر ما عدّله المستخدم من داخل النظام. */
async function seedUnits(units: OrgUnit[], parentId: string | null) {
  for (const [index, unit] of units.entries()) {
    const department = await prisma.department.upsert({
      where: { name: unit.name },
      update: {},
      create: { name: unit.name, parentId, sortOrder: index },
    });
    if (unit.children) await seedUnits(unit.children, department.id);
  }
}

async function main() {
  await seedUnits(ORG_STRUCTURE, null);

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@erp.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345";
  const it = await prisma.department.findUniqueOrThrow({ where: { name: "إدارة تقنية المعلومات" } });

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      employeeNo: "0001",
      name: "مدير النظام",
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "ADMIN",
      jobTitle: "مدير النظام",
      departmentId: it.id,
    },
  });

  console.log(`Admin ready: ${email}`);
}

main().finally(() => prisma.$disconnect());
