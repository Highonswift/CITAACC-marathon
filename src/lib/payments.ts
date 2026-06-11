import { prisma } from "@/lib/prisma";
import { sendMail, registrationEmailHtml } from "@/lib/email";

export interface PaidResult {
  regCode: string;
  alreadyPaid: boolean;
  participants: {
    id: string;
    fullName: string;
    bibNumber: string;
    token: string;
    category: string;
    tshirtSize: string;
  }[];
}

// Idempotently marks a registration PAID, then (only on the first transition)
// fires the confirmation email. Safe to call from both the client-verify route
// and the Razorpay webhook — whichever arrives first wins; the second is a no-op.
export async function markRegistrationPaid(opts: {
  regId: string;
  paymentId?: string | null;
  signature?: string | null;
}): Promise<PaidResult | null> {
  const existing = await prisma.registration.findUnique({
    where: { id: opts.regId },
    include: { participants: true },
  });
  if (!existing) return null;

  const alreadyPaid = existing.paymentStatus === "PAID";

  const updated = alreadyPaid
    ? existing
    : await prisma.registration.update({
        where: { id: opts.regId },
        data: {
          paymentStatus: "PAID",
          paidAt: new Date(),
          razorpayPaymentId: opts.paymentId || existing.razorpayPaymentId || "unknown",
          razorpaySignature: opts.signature || existing.razorpaySignature || null,
        },
        include: { participants: true },
      });

  if (!alreadyPaid) {
    // Fire-and-forget confirmation email (console fallback when SMTP unset).
    sendMail({
      to: updated.email,
      subject: `Registration Confirmed – ${updated.regCode}`,
      html: registrationEmailHtml({
        regCode: updated.regCode,
        fullName: updated.fullName,
        participants: updated.participants.map((p) => ({
          fullName: p.fullName,
          bibNumber: p.bibNumber,
          token: p.qrToken,
        })),
      }),
    }).catch(() => {});
  }

  return {
    regCode: updated.regCode,
    alreadyPaid,
    participants: updated.participants.map((p) => ({
      id: p.id,
      fullName: p.fullName,
      bibNumber: p.bibNumber,
      token: p.qrToken,
      category: p.category,
      tshirtSize: p.tshirtSize,
    })),
  };
}
