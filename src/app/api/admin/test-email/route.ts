import { NextResponse } from "next/server";
import { hasRole } from "@/lib/auth";
import { sendTestEmail } from "@/lib/email";

// Admin-only diagnostic: send a test email and return the REAL SMTP result/error.
// Usage: POST /api/admin/test-email  { "to": "you@example.com" }
export async function POST(req: Request) {
  if (!(await hasRole("admin"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { to } = (await req.json().catch(() => ({}))) as { to?: string };
  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return NextResponse.json({ error: "Provide a valid 'to' email" }, { status: 400 });
  }
  const result = await sendTestEmail(to);
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
