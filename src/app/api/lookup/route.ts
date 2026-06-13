import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail, registrationEmailHtml } from "@/lib/email";

// Self-service registration lookup.
//   action "view"   → requires email + a second factor (reg code or mobile);
//                     returns the registration + passes on screen.
//   action "resend" → requires email only; re-emails the passes. Always returns a
//                     generic response (no account enumeration), and only sends for
//                     PAID registrations.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    action?: "view" | "resend";
    email?: string;
    secondFactor?: string; // reg code or mobile (view only)
  };

  const email = (body.email || "").trim();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (body.action === "resend") {
    // Find all PAID registrations under this email and re-send their passes.
    const regs = await prisma.registration.findMany({
      where: { email: { equals: email, mode: "insensitive" }, paymentStatus: "PAID" },
      include: { participants: true },
    });

    for (const reg of regs) {
      await sendMail({
        to: reg.email,
        subject: `Your CITAACC 5K passes – ${reg.regCode}`,
        html: registrationEmailHtml({
          regCode: reg.regCode,
          fullName: reg.fullName,
          participants: reg.participants.map((p) => ({
            fullName: p.fullName,
            bibNumber: p.bibNumber,
            token: p.qrToken,
          })),
        }),
      }).catch(() => {});
    }

    // Generic response regardless of whether a match existed.
    return NextResponse.json({
      ok: true,
      message:
        "If a paid registration exists for that email, we've re-sent your passes. Please check your inbox (and spam).",
    });
  }

  // action "view"
  const secondFactor = (body.secondFactor || "").trim();
  if (!secondFactor) {
    return NextResponse.json(
      { error: "Enter your registration code or mobile number to view details." },
      { status: 400 }
    );
  }

  const registration = await prisma.registration.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      OR: [
        { regCode: { equals: secondFactor, mode: "insensitive" } },
        { mobile: secondFactor },
      ],
    },
    include: { participants: { orderBy: { bibNumber: "asc" } } },
  });

  if (!registration) {
    return NextResponse.json(
      { error: "No registration found. Check your email and registration code / mobile number." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    registration: {
      regCode: registration.regCode,
      fullName: registration.fullName,
      email: registration.email,
      mobile: registration.mobile,
      paymentStatus: registration.paymentStatus,
      totalAmount: registration.totalAmount,
      createdAt: registration.createdAt,
      participants: registration.participants.map((p) => ({
        fullName: p.fullName,
        bibNumber: p.bibNumber,
        category: p.category,
        tshirtSize: p.tshirtSize,
        token: p.qrToken,
        attendanceStatus: p.attendanceStatus,
        tshirtStatus: p.tshirtStatus,
      })),
    },
  });
}
