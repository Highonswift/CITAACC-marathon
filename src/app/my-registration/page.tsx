"use client";

import { useState } from "react";
import Link from "next/link";
import { EVENT } from "@/lib/constants";
import { formatINR } from "@/lib/pricing";

type Participant = {
  fullName: string;
  bibNumber: string;
  category: "ADULT" | "KID";
  tshirtSize: string;
  token: string;
  attendanceStatus: "NOT_CHECKED_IN" | "PRESENT";
  tshirtStatus: "PENDING" | "DISTRIBUTED";
};

type Registration = {
  regCode: string;
  fullName: string;
  email: string;
  mobile: string;
  paymentStatus: "PAID" | "PENDING" | "FAILED";
  totalAmount: number;
  createdAt: string;
  participants: Participant[];
};

export default function MyRegistrationPage() {
  const [email, setEmail] = useState("");
  const [secondFactor, setSecondFactor] = useState("");
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState<"view" | "resend" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onView(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setRegistration(null);
    setLoading("view");
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "view", email, secondFactor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed.");
      setRegistration(data.registration);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed.");
    } finally {
      setLoading(null);
    }
  }

  async function onResend() {
    setError(null);
    setNotice(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError("Enter a valid email address first.");
      return;
    }
    setLoading("resend");
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend", email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not resend.");
      setNotice(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="container-x flex items-center justify-between py-4">
          <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            ← Home
          </Link>
          <span className="chip bg-brand-50 text-brand-700">{EVENT.shortName}</span>
        </div>
      </header>

      <div className="container-x max-w-2xl py-8">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Find my registration</h1>
        <p className="mt-2 text-slate-600">
          Look up your registration and passes, or have them re-sent to your email.
        </p>

        {/* Lookup form */}
        <form onSubmit={onView} className="card mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="lk-email">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="lk-email"
              type="email"
              className="field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="lk-sf">
              Registration code or mobile number
            </label>
            <input
              id="lk-sf"
              className="field"
              placeholder="REG2026-001  or  10-digit mobile"
              value={secondFactor}
              onChange={(e) => setSecondFactor(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">
              Needed to view details on screen. Your registration code is in your confirmation email.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="submit" className="btn-primary flex-1" disabled={loading !== null}>
              {loading === "view" ? "Looking up…" : "View my registration"}
            </button>
            <button
              type="button"
              onClick={onResend}
              className="btn-ghost flex-1"
              disabled={loading !== null}
            >
              {loading === "resend" ? "Sending…" : "Email me my passes"}
            </button>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {notice}
            </p>
          )}
        </form>

        {/* Result */}
        {registration && (
          <div className="card mt-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Registration
                </p>
                <p className="text-lg font-bold text-slate-900">{registration.regCode}</p>
              </div>
              <PaymentChip status={registration.paymentStatus} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Name" value={registration.fullName} />
              <Info label="Mobile" value={registration.mobile} />
              <Info label="Amount" value={formatINR(registration.totalAmount)} />
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Participants ({registration.participants.length})
              </p>
              <div className="space-y-2">
                {registration.participants.map((p) => (
                  <div
                    key={p.token}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{p.fullName}</p>
                      <p className="text-xs text-slate-500">
                        {p.category === "ADULT" ? "Adult" : "Kid"} · Bib {p.bibNumber} · Size{" "}
                        {p.tshirtSize}
                      </p>
                    </div>
                    <Link href={`/pass/${p.token}`} className="btn-primary px-4 py-2 text-xs">
                      View pass →
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {registration.paymentStatus !== "PAID" && (
              <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Payment for this registration is <b>{registration.paymentStatus}</b>. Passes are valid
                only after payment is completed.
              </p>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Haven&apos;t registered yet?{" "}
          <Link href="/register" className="font-semibold text-brand-700 hover:underline">
            Register now
          </Link>
        </p>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="font-medium text-slate-900">{value}</p>
    </div>
  );
}

function PaymentChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID: "bg-emerald-50 text-emerald-700",
    PENDING: "bg-amber-50 text-amber-700",
    FAILED: "bg-red-50 text-red-700",
  };
  return <span className={`chip ${map[status] ?? "bg-slate-100 text-slate-600"}`}>{status}</span>;
}
