import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature, hasWebhookSecret } from "@/lib/razorpay";
import { markRegistrationPaid } from "@/lib/payments";

// Razorpay calls this server-to-server after a payment. It is the reliable
// source of truth: even if the user closes the browser before client-side
// verification runs, this still marks the registration PAID.
//
// Configure in the Razorpay Dashboard → Settings → Webhooks:
//   URL:     https://<your-domain>/api/payment/webhook
//   Secret:  must match RAZORPAY_WEBHOOK_SECRET
//   Events:  payment.captured  (and optionally order.paid / payment.failed)
export async function POST(req: Request) {
  if (!hasWebhookSecret) {
    // Not configured — acknowledge so Razorpay doesn't retry endlessly.
    return NextResponse.json({ ok: true, ignored: "webhook secret not configured" });
  }

  const signature = req.headers.get("x-razorpay-signature") || "";
  const rawBody = await req.text();

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string } };
      order?: { entity?: { id?: string } };
    };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = event.event;
  const payment = event.payload?.payment?.entity;
  const orderId = payment?.order_id || event.payload?.order?.entity?.id;

  if ((type === "payment.captured" || type === "order.paid") && orderId) {
    const reg = await prisma.registration.findFirst({
      where: { razorpayOrderId: orderId },
      select: { id: true },
    });
    if (reg) {
      await markRegistrationPaid({
        regId: reg.id,
        paymentId: payment?.id,
        signature: signature,
      });
    }
  } else if (type === "payment.failed" && orderId) {
    await prisma.registration.updateMany({
      where: { razorpayOrderId: orderId, paymentStatus: "PENDING" },
      data: { paymentStatus: "FAILED" },
    });
  }

  // Always 200 so Razorpay marks the event delivered.
  return NextResponse.json({ ok: true });
}
