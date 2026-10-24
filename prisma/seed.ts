import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@erp.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345";

  const management = await prisma.department.upsert({
    where: { name: "الإدارة العامة" },
    update: {},
    create: { name: "الإدارة العامة" },
  });

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
      departmentId: management.id,
    },
  });

  console.log(`Admin ready: ${email}`);
}

main().finally(() => prisma.$disconnect());
