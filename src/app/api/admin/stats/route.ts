import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/auth";

export async function GET() {
  if (!(await hasRole("admin"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paidWhere = { registration: { paymentStatus: "PAID" as const } };

  const [
    totalRegistrations,
    paidRegistrations,
    pendingRegistrations,
    revenueAgg,
    totalParticipants,
    adults,
    kids,
    checkedIn,
    tshirtDistributed,
    tshirtGroups,
    zoneGroups,
  ] = await Promise.all([
    prisma.registration.count(),
    prisma.registration.count({ where: { paymentStatus: "PAID" } }),
    prisma.registration.count({ where: { paymentStatus: "PENDING" } }),
    prisma.registration.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { totalAmount: true },
    }),
    prisma.participant.count({ where: paidWhere }),
    prisma.participant.count({ where: { ...paidWhere, category: "ADULT" } }),
    prisma.participant.count({ where: { ...paidWhere, category: "KID" } }),
    prisma.participant.count({ where: { ...paidWhere, attendanceStatus: "PRESENT" } }),
    prisma.participant.count({ where: { ...paidWhere, tshirtStatus: "DISTRIBUTED" } }),
    prisma.participant.groupBy({
      by: ["tshirtSize"],
      where: paidWhere,
      _count: { _all: true },
    }),
    prisma.registration.groupBy({
      by: ["chennaiZone"],
      where: { paymentStatus: "PAID" },
      _count: { _all: true },
    }),
  ]);

  const revenue = revenueAgg._sum.totalAmount || 0;

  const tshirtBySize: Record<string, number> = {};
  for (const g of tshirtGroups) tshirtBySize[g.tshirtSize] = g._count._all;

  const zoneCounts: Record<string, number> = {};
  for (const g of zoneGroups) zoneCounts[g.chennaiZone] = g._count._all;

  return NextResponse.json({
    registration: {
      totalRegistrations,
      paidRegistrations,
      pendingRegistrations,
      totalParticipants,
      adults,
      kids,
      revenue,
    },
    attendance: {
      registered: totalParticipants,
      checkedIn,
      absent: totalParticipants - checkedIn,
    },
    tshirt: {
      bySize: tshirtBySize,
      distributed: tshirtDistributed,
      pending: totalParticipants - tshirtDistributed,
    },
    zones: zoneCounts,
  });
}
