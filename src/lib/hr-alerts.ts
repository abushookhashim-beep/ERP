import "server-only";
import { db } from "./db";
import { addDays, todayDate } from "./hr";

export type HrAlert = { id: string; userId: string; name: string; label: string; date: Date };

/** المستندات المنتهية والقريبة الانتهاء، والعقود وفترات التجربة القريبة، للموظفين النشطين فقط. */
export async function getHrAlerts(alertDays: number) {
  const today = todayDate();
  const horizon = addDays(today, alertDays);
  const probationHorizon = addDays(today, 30);

  const [documents, contracts, probations] = await Promise.all([
    db.employeeDocument.findMany({
      where: { expiryDate: { lte: horizon }, user: { active: true } },
      orderBy: { expiryDate: "asc" },
      select: { id: true, type: true, expiryDate: true, user: { select: { id: true, name: true } } },
    }),
    db.employeeProfile.findMany({
      where: { contractEnd: { gte: today, lte: horizon }, user: { active: true } },
      orderBy: { contractEnd: "asc" },
      select: { id: true, contractEnd: true, user: { select: { id: true, name: true } } },
    }),
    db.employeeProfile.findMany({
      where: { probationEnd: { gte: today, lte: probationHorizon }, user: { active: true } },
      orderBy: { probationEnd: "asc" },
      select: { id: true, probationEnd: true, user: { select: { id: true, name: true } } },
    }),
  ]);

  const docs = documents.map((d) => ({ id: d.id, userId: d.user.id, name: d.user.name, label: d.type, date: d.expiryDate! }));
  return {
    expiredDocs: docs.filter((d) => d.date < today),
    expiringDocs: docs.filter((d) => d.date >= today),
    contractsEnding: contracts.map((c) => ({ id: c.id, userId: c.user.id, name: c.user.name, label: "", date: c.contractEnd! })),
    probationEnding: probations.map((p) => ({ id: p.id, userId: p.user.id, name: p.user.name, label: "", date: p.probationEnd! })),
  };
}

export function alertCount(alerts: Awaited<ReturnType<typeof getHrAlerts>>) {
  return alerts.expiredDocs.length + alerts.expiringDocs.length + alerts.contractsEnding.length + alerts.probationEnding.length;
}
