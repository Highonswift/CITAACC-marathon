import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Lookup a participant by QR token OR bib number. Used by the volunteer portal
// (manual entry can be a token, a pass link, or a bib like CITAACC-0023).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const participant = await prisma.participant.findFirst({
    where: {
      OR: [
        { qrToken: token },
        { bibNumber: { equals: token, mode: "insensitive" } },
      ],
    },
    include: {
      registration: {
        select: {
          regCode: true,
          fullName: true,
          mobile: true,
          email: true,
          paymentStatus: true,
        },
      },
    },
  });

  if (!participant) {
    return NextResponse.json({ error: "Pass not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: participant.id,
    token: participant.qrToken,
    bibNumber: participant.bibNumber,
    fullName: participant.fullName,
    category: participant.category,
    age: participant.age,
    gender: participant.gender,
    tshirtSize: participant.tshirtSize,
    attendanceStatus: participant.attendanceStatus,
    attendanceAt: participant.attendanceAt,
    attendanceVolunteer: participant.attendanceVolunteer,
    tshirtStatus: participant.tshirtStatus,
    tshirtAt: participant.tshirtAt,
    tshirtVolunteer: participant.tshirtVolunteer,
    registration: participant.registration,
  });
}
