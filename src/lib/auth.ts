import { cookies } from "next/headers";
import crypto from "crypto";

export type Role = "admin" | "volunteer";

const COOKIE = { admin: "citaacc_admin", volunteer: "citaacc_volunteer" } as const;

function secretFor(role: Role): string {
  return role === "admin"
    ? process.env.ADMIN_PASSCODE || "citaacc-admin-2026"
    : process.env.VOLUNTEER_PASSCODE || "citaacc-volunteer-2026";
}

// Token = HMAC of the role passcode; verifying just recomputes it.
function tokenFor(role: Role): string {
  return crypto.createHash("sha256").update(`${role}:${secretFor(role)}`).digest("hex");
}

export function checkPasscode(role: Role, passcode: string): boolean {
  return passcode === secretFor(role);
}

export async function grantSession(role: Role) {
  const jar = await cookies();
  jar.set(COOKIE[role], tokenFor(role), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });
}

export async function clearSession(role: Role) {
  const jar = await cookies();
  jar.delete(COOKIE[role]);
}

export async function hasRole(role: Role): Promise<boolean> {
  const jar = await cookies();
  const value = jar.get(COOKIE[role])?.value;
  return !!value && value === tokenFor(role);
}
