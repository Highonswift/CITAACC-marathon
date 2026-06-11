"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EVENT } from "@/lib/constants";

export default function AdminLogin() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "admin", passcode }),
      });
      if (!res.ok) {
        setError("Incorrect passcode. Please try again.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <div className="mb-6 text-center">
          <span className="chip mb-3 inline-block bg-brand-50 text-brand-700">
            Admin Access
          </span>
          <h1 className="text-2xl font-bold text-slate-900">
            Organizer Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {EVENT.shortName} — enter the admin passcode to continue.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="passcode">
              Admin Passcode
            </label>
            <input
              id="passcode"
              type="password"
              className="field"
              autoComplete="current-password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter passcode"
              required
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading || !passcode}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
