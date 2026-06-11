import { NextResponse } from "next/server";
import { clearSession, type Role } from "@/lib/auth";

export async function POST(req: Request) {
  const { role } = (await req.json().catch(() => ({}))) as { role?: Role };
  if (role === "admin" || role === "volunteer") {
    await clearSession(role);
  }
  return NextResponse.json({ success: true });
}
