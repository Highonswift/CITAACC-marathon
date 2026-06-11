import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySignature } from "@/lib/razorpay";
import { markRegistrationPaid } from "@/lib/payments";

export async function POST(req: Request) {
  let body: {
    regId?: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { regId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!regId || !razorpay_order_id) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const registration = await prisma.registration.findUnique({
    where: { id: regId },
    select: { razorpayOrderId: true },
  });
  if (!registration) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }
  if (registration.razorpayOrderId !== razorpay_order_id) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }

  const ok = verifySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id || "mock_payment",
    signature: razorpay_signature || "mock_signature",
  });

  if (!ok) {
    await prisma.registration.update({
      where: { id: regId },
      data: { paymentStatus: "FAILED" },
    });
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  const result = await markRegistrationPaid({
    regId,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });
  if (!result) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    regCode: result.regCode,
    participants: result.participants,
  });
}
