import { NextResponse } from "next/server";
import { checkPasscode, grantSession, type Role } from "@/lib/auth";

// Unified passcode login for admin & volunteer portals.
export async function POST(req: Request) {
  const { role, passcode } = (await req.json().catch(() => ({}))) as {
    role?: Role;
    passcode?: string;
  };

  if (role !== "admin" && role !== "volunteer") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if (!passcode || !checkPasscode(role, passcode)) {
    return NextResponse.json({ error: "Incorrect passcode" }, { status: 401 });
  }

  await grantSession(role);
  return NextResponse.json({ success: true, role });
}
