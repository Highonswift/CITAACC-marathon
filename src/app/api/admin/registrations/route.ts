import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/auth";

export async function GET(req: Request) {
  if (!(await hasRole("admin"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status"); // PAID | PENDING | FAILED | null
  const q = (url.searchParams.get("q") || "").trim();

  const registrations = await prisma.registration.findMany({
    where: {
      ...(status ? { paymentStatus: status as "PAID" | "PENDING" | "FAILED" } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { mobile: { contains: q } },
              { regCode: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { participants: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json({ registrations });
}
