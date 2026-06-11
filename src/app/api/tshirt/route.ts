import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/auth";

// Volunteer marks a participant's T-shirt as distributed. Idempotent.
export async function POST(req: Request) {
  if (!(await hasRole("volunteer"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token, volunteer } = (await req.json().catch(() => ({}))) as {
    token?: string;
    volunteer?: string;
  };
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const participant = await prisma.participant.findUnique({ where: { qrToken: token } });
  if (!participant) {
    return NextResponse.json({ error: "Pass not found" }, { status: 404 });
  }

  if (participant.tshirtStatus === "DISTRIBUTED") {
    return NextResponse.json({
      alreadyDone: true,
      tshirtStatus: participant.tshirtStatus,
      tshirtAt: participant.tshirtAt,
      tshirtVolunteer: participant.tshirtVolunteer,
    });
  }

  const updated = await prisma.participant.update({
    where: { qrToken: token },
    data: {
      tshirtStatus: "DISTRIBUTED",
      tshirtAt: new Date(),
      tshirtVolunteer: volunteer || "Volunteer",
    },
  });

  return NextResponse.json({
    success: true,
    tshirtStatus: updated.tshirtStatus,
    tshirtAt: updated.tshirtAt,
    tshirtVolunteer: updated.tshirtVolunteer,
  });
}
