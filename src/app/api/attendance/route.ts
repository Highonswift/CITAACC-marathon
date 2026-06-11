import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/auth";

// Volunteer marks a participant present. Idempotent — re-scanning is safe.
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

  if (participant.attendanceStatus === "PRESENT") {
    return NextResponse.json({
      alreadyDone: true,
      attendanceStatus: participant.attendanceStatus,
      attendanceAt: participant.attendanceAt,
      attendanceVolunteer: participant.attendanceVolunteer,
    });
  }

  const updated = await prisma.participant.update({
    where: { qrToken: token },
    data: {
      attendanceStatus: "PRESENT",
      attendanceAt: new Date(),
      attendanceVolunteer: volunteer || "Volunteer",
    },
  });

  return NextResponse.json({
    success: true,
    attendanceStatus: updated.attendanceStatus,
    attendanceAt: updated.attendanceAt,
    attendanceVolunteer: updated.attendanceVolunteer,
  });
}
