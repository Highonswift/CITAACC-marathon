"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type StoredParticipant = {
  id: string;
  fullName: string;
  bibNumber: string;
  token: string;
  category: "ADULT" | "KID";
  tshirtSize: string;
};

type StoredReg = {
  regCode: string;
  participants: StoredParticipant[];
};

export default function SuccessPage() {
  const [data, setData] = useState<StoredReg | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("citaacc:lastReg");
      if (raw) {
        const parsed = JSON.parse(raw) as StoredReg;
        if (parsed && parsed.regCode && Array.isArray(parsed.participants)) {
          setData(parsed);
        }
      }
    } catch {
      setData(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  function openAllPasses() {
    if (!data) return;
    for (const p of data.participants) {
      window.open(`/pass/${p.token}`, "_blank", "noopener");
    }
  }

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
            🔍
          </div>
          <h1 className="text-lg font-semibold text-slate-900">
            No recent registration found
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            We couldn&apos;t find a recent registration in this browser. If you just paid,
            check your email for your confirmation and passes.
          </p>
          <Link href="/" className="btn-primary mt-5 w-full">
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-16">
      <div className="container-x max-w-2xl pt-10">
        <div className="card text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
            🎉
          </div>
          <h1 className="text-2xl font-bold text-slate-900">You&apos;re registered!</h1>
          <p className="mt-1 text-sm text-slate-600">
            Thank you for joining the CITAACC 5K Walk/Jog. We can&apos;t wait to see you.
          </p>

          <div className="mx-auto mt-4 inline-flex flex-col items-center rounded-xl bg-brand-50 px-6 py-3">
            <span className="text-xs font-medium uppercase tracking-wide text-brand-600">
              Registration Code
            </span>
            <span className="text-xl font-bold tracking-wider text-brand-800">
              {data.regCode}
            </span>
          </div>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-slate-500">
            <span aria-hidden>✉️</span>
            A confirmation email with your passes has been sent.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Participants &amp; Passes
            </h2>
            <button
              type="button"
              onClick={openAllPasses}
              className="btn-ghost px-4 py-2 text-xs"
            >
              Open all passes
            </button>
          </div>

          <ul className="space-y-3">
            {data.participants.map((p) => (
              <li key={p.id || p.token} className="card flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{p.fullName}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    <span className="chip mr-1 bg-slate-100 text-slate-600">
                      Bib #{p.bibNumber}
                    </span>
                    {p.category === "ADULT" ? "Adult" : "Kid"} · Size {p.tshirtSize}
                  </p>
                </div>
                <Link
                  href={`/pass/${p.token}`}
                  className="btn-primary px-4 py-2 text-xs"
                >
                  View / Download Pass
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
