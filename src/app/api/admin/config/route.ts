import { NextResponse } from "next/server";
import { hasRole } from "@/lib/auth";
import { isMockPayment, hasWebhookSecret } from "@/lib/razorpay";
import { isEmailConfigured, verifyEmailConnection } from "@/lib/email";

// Operational health: tells organizers whether live payments & email are wired.
export async function GET() {
  if (!(await hasRole("admin"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = isEmailConfigured
    ? await verifyEmailConnection()
    : { ok: false, error: "SMTP not configured (emails log to console)" };

  return NextResponse.json({
    payments: {
      mode: isMockPayment ? "mock" : "live",
      live: !isMockPayment,
      webhookConfigured: hasWebhookSecret,
    },
    email: {
      configured: isEmailConfigured,
      ok: email.ok,
      detail: email.ok ? "SMTP connection verified" : email.error,
    },
  });
}
