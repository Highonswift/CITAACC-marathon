"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const NAME_KEY = "citaacc:volunteerName";

export default function VolunteerLogin() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your name so we can track who scanned what.");
      return;
    }
    if (!passcode.trim()) {
      setError("Please enter the volunteer passcode.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "volunteer", passcode: passcode.trim() }),
      });

      if (res.status === 401) {
        setError("Incorrect passcode. Please check with the organizers and try again.");
        return;
      }
      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      try {
        window.localStorage.setItem(NAME_KEY, name.trim());
      } catch {
        // localStorage may be unavailable; the scanner will prompt again.
      }
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card">
        <h1 className="text-xl font-bold text-slate-900">Volunteer sign in</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in to scan participant passes for check-in and T-shirt distribution.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="vol-name" className="label">
              Your name
            </label>
            <input
              id="vol-name"
              type="text"
              autoComplete="name"
              className="field"
              placeholder="e.g. Priya"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="vol-pass" className="label">
              Volunteer passcode
            </label>
            <input
              id="vol-pass"
              type="password"
              autoComplete="off"
              className="field"
              placeholder="Enter passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              The passcode is provided by the event organizers.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200"
            >
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full py-3.5 text-base" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
