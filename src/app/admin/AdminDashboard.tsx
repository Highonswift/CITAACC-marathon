"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/pricing";

type Stats = {
  registration: {
    totalRegistrations: number;
    paidRegistrations: number;
    pendingRegistrations: number;
    totalParticipants: number;
    adults: number;
    kids: number;
    revenue: number;
  };
  attendance: {
    registered: number;
    checkedIn: number;
    absent: number;
  };
  tshirt: {
    bySize: Record<string, number>;
    distributed: number;
    pending: number;
  };
  zones: Record<string, number>;
};

type Participant = {
  id: string;
  fullName: string;
  bibNumber: number | string | null;
  category: "ADULT" | "KID";
  age: number;
  gender: string;
  tshirtSize: string;
  attendanceStatus?: "NOT_CHECKED_IN" | "PRESENT";
  tshirtStatus?: "PENDING" | "DISTRIBUTED";
};

type PaymentStatus = "PAID" | "PENDING" | "FAILED" | string;

type Registration = {
  id: string;
  regCode: string;
  fullName: string;
  mobile: string;
  email?: string;
  chennaiZone: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  participants: Participant[];
};

type StatusFilter = "ALL" | "PAID" | "PENDING" | "FAILED";

type ConfigStatus = {
  payments: { mode: "live" | "mock"; live: boolean; webhookConfigured: boolean };
  email: { configured: boolean; ok: boolean; detail: string };
};

const EXPORTS: { type: string; label: string }[] = [
  { type: "registrations", label: "Registrations" },
  { type: "participants", label: "Participants" },
  { type: "attendance", label: "Attendance" },
  { type: "tshirt", label: "T-Shirts" },
  { type: "revenue", label: "Revenue" },
  { type: "zones", label: "Zones" },
];

function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function StatCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  tone?: "slate" | "brand" | "accent" | "green" | "red";
}) {
  const tones: Record<string, string> = {
    slate: "text-slate-900",
    brand: "text-brand-700",
    accent: "text-accent-600",
    green: "text-emerald-600",
    red: "text-red-600",
  };
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function PaymentChip({ status }: { status: PaymentStatus }) {
  const map: Record<string, string> = {
    PAID: "bg-emerald-50 text-emerald-700",
    PENDING: "bg-amber-50 text-amber-700",
    FAILED: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`chip ${map[status] ?? "bg-slate-100 text-slate-600"}`}
    >
      {status}
    </span>
  );
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filterRef = useRef({ q, status });
  filterRef.current = { q, status };

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats", { cache: "no-store" });
    if (res.status === 401) {
      router.refresh();
      return;
    }
    if (!res.ok) throw new Error("stats");
    setStats(await res.json());
  }, [router]);

  const loadRegistrations = useCallback(async () => {
    const { q: cq, status: cs } = filterRef.current;
    const params = new URLSearchParams();
    if (cs !== "ALL") params.set("status", cs);
    if (cq.trim()) params.set("q", cq.trim());
    const res = await fetch(
      `/api/admin/registrations?${params.toString()}`,
      { cache: "no-store" }
    );
    if (res.status === 401) {
      router.refresh();
      return;
    }
    if (!res.ok) throw new Error("registrations");
    const data = await res.json();
    setRegistrations(data.registrations ?? []);
  }, [router]);

  const refreshAll = useCallback(async () => {
    setError(null);
    try {
      await Promise.all([loadStats(), loadRegistrations()]);
      setLastUpdated(new Date());
    } catch {
      setError("Failed to load dashboard data. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }, [loadStats, loadRegistrations]);

  // Initial load + auto-refresh every 30s.
  useEffect(() => {
    refreshAll();
    const id = setInterval(refreshAll, 30000);
    return () => clearInterval(id);
  }, [refreshAll]);

  // Config status (payments/email) — fetched once on mount.
  useEffect(() => {
    fetch("/api/admin/config", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => c && setConfig(c))
      .catch(() => {});
  }, []);

  // Re-fetch registrations when filters change (debounced).
  useEffect(() => {
    const id = setTimeout(() => {
      loadRegistrations().catch(() =>
        setError("Failed to load registrations.")
      );
    }, 300);
    return () => clearTimeout(id);
  }, [q, status, loadRegistrations]);

  async function onLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "admin" }),
    });
    router.refresh();
  }

  const reg = stats?.registration;
  const att = stats?.attendance;
  const tshirt = stats?.tshirt;

  const sortedZones = useMemo(() => {
    if (!stats?.zones) return [];
    return Object.entries(stats.zones).sort((a, b) => b[1] - a[1]);
  }, [stats?.zones]);
  const maxZone = sortedZones.length ? sortedZones[0][1] : 0;

  const sortedSizes = useMemo(() => {
    if (!tshirt?.bySize) return [];
    return Object.entries(tshirt.bySize).sort((a, b) => b[1] - a[1]);
  }, [tshirt?.bySize]);
  const maxSize = sortedSizes.length
    ? Math.max(...sortedSizes.map(([, v]) => v))
    : 0;

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-16 text-slate-500">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString("en-IN")} · auto-refresh 30s`
            : "Real-time · auto-refresh 30s"}
        </p>
        <div className="flex items-center gap-2">
          <button onClick={refreshAll} className="btn-ghost">
            Refresh
          </button>
          <button onClick={onLogout} className="btn-primary">
            Logout
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {config && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`chip ${
              config.payments.live
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            Payments: {config.payments.live ? "Live (Razorpay)" : "Mock mode"}
          </span>
          {config.payments.live && (
            <span
              className={`chip ${
                config.payments.webhookConfigured
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              Webhook: {config.payments.webhookConfigured ? "Configured" : "Not set"}
            </span>
          )}
          <span
            className={`chip ${
              config.email.ok
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
            title={config.email.detail}
          >
            Email: {config.email.ok ? "Connected" : "Console fallback"}
          </span>
        </div>
      )}

      {/* REGISTRATION DASHBOARD */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          Registration Dashboard
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard
            label="Total Registrations"
            value={reg?.totalRegistrations ?? 0}
            tone="brand"
          />
          <StatCard label="Paid" value={reg?.paidRegistrations ?? 0} tone="green" />
          <StatCard
            label="Pending Payments"
            value={reg?.pendingRegistrations ?? 0}
            tone="red"
          />
          <StatCard
            label="Total Participants"
            value={reg?.totalParticipants ?? 0}
          />
          <StatCard label="Adults" value={reg?.adults ?? 0} />
          <StatCard label="Kids" value={reg?.kids ?? 0} />
          <StatCard
            label="Revenue Collected"
            value={formatINR(reg?.revenue ?? 0)}
            tone="accent"
          />
        </div>
      </section>

      {/* ATTENDANCE DASHBOARD */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          Attendance Dashboard
        </h2>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="grid grid-cols-3 gap-3 lg:col-span-1">
            <StatCard label="Registered" value={att?.registered ?? 0} tone="brand" />
            <StatCard label="Checked In" value={att?.checkedIn ?? 0} tone="green" />
            <StatCard label="Absent" value={att?.absent ?? 0} tone="red" />
          </div>
          <div className="card lg:col-span-2">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Check-in progress</span>
              <span className="font-semibold text-slate-900">
                {pct(att?.checkedIn ?? 0, att?.registered ?? 0)}%
              </span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${pct(att?.checkedIn ?? 0, att?.registered ?? 0)}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {att?.checkedIn ?? 0} of {att?.registered ?? 0} participants checked in.
            </p>
          </div>
        </div>
      </section>

      {/* T-SHIRT DASHBOARD */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          T-Shirt Dashboard
        </h2>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="grid grid-cols-2 gap-3 lg:col-span-1">
            <StatCard
              label="Distributed"
              value={tshirt?.distributed ?? 0}
              tone="green"
            />
            <StatCard label="Pending" value={tshirt?.pending ?? 0} tone="accent" />
          </div>
          <div className="card lg:col-span-2">
            <p className="mb-3 text-sm font-medium text-slate-700">
              Size-wise breakdown
            </p>
            {sortedSizes.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet.</p>
            ) : (
              <div className="space-y-2">
                {sortedSizes.map(([size, count]) => (
                  <div key={size} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-sm font-medium text-slate-700">
                      {size}
                    </span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${pct(count, maxSize)}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-sm font-semibold text-slate-900">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CHENNAI ZONE ANALYTICS */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          Chennai Zone Analytics
        </h2>
        <div className="card">
          {sortedZones.length === 0 ? (
            <p className="text-sm text-slate-500">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {sortedZones.map(([zone, count]) => (
                <div key={zone} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-sm font-medium text-slate-700 sm:w-40">
                    {zone}
                  </span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-accent-500"
                      style={{ width: `${pct(count, maxZone)}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-sm font-semibold text-slate-900">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* REPORTS & EXPORTS */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          Reports &amp; Exports (CSV)
        </h2>
        <div className="card">
          <div className="flex flex-wrap gap-2">
            {EXPORTS.map((ex) => (
              <a
                key={ex.type}
                href={`/api/admin/export?type=${ex.type}`}
                download
                className="btn-ghost text-sm"
              >
                ⬇ {ex.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* REGISTRATIONS TABLE */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">Registrations</h2>
        <div className="card">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              className="field sm:max-w-xs"
              placeholder="Search name, mobile, reg code…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="flex gap-2">
              {(["ALL", "PAID", "PENDING", "FAILED"] as StatusFilter[]).map(
                (s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`chip ${
                      status === s
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {s === "ALL" ? "All" : s}
                  </button>
                )
              )}
            </div>
          </div>

          {registrations.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No registrations match your filters.
            </p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-2 py-2">Reg Code</th>
                      <th className="px-2 py-2">Name</th>
                      <th className="px-2 py-2">Mobile</th>
                      <th className="px-2 py-2">Zone</th>
                      <th className="px-2 py-2 text-center">#</th>
                      <th className="px-2 py-2 text-right">Amount</th>
                      <th className="px-2 py-2">Payment</th>
                      <th className="px-2 py-2">Created</th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((r) => (
                      <RegRow
                        key={r.id}
                        reg={r}
                        open={expanded === r.id}
                        onToggle={() =>
                          setExpanded(expanded === r.id ? null : r.id)
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {registrations.map((r) => (
                  <RegCard
                    key={r.id}
                    reg={r}
                    open={expanded === r.id}
                    onToggle={() =>
                      setExpanded(expanded === r.id ? null : r.id)
                    }
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function ParticipantsTable({ participants }: { participants: Participant[] }) {
  if (!participants.length) {
    return <p className="text-sm text-slate-500">No participants.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-slate-500">
            <th className="px-2 py-1">Bib</th>
            <th className="px-2 py-1">Name</th>
            <th className="px-2 py-1">Category</th>
            <th className="px-2 py-1">Size</th>
            <th className="px-2 py-1">Attendance</th>
            <th className="px-2 py-1">T-Shirt</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p) => (
            <tr key={p.id} className="border-t border-slate-100">
              <td className="px-2 py-1 font-mono">{p.bibNumber ?? "—"}</td>
              <td className="px-2 py-1">{p.fullName}</td>
              <td className="px-2 py-1">{p.category}</td>
              <td className="px-2 py-1">{p.tshirtSize}</td>
              <td className="px-2 py-1">
                <span
                  className={
                    p.attendanceStatus === "PRESENT"
                      ? "text-emerald-600"
                      : "text-slate-500"
                  }
                >
                  {p.attendanceStatus === "PRESENT" ? "Present" : "Not in"}
                </span>
              </td>
              <td className="px-2 py-1">
                <span
                  className={
                    p.tshirtStatus === "DISTRIBUTED"
                      ? "text-emerald-600"
                      : "text-slate-500"
                  }
                >
                  {p.tshirtStatus === "DISTRIBUTED" ? "Given" : "Pending"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RegRow({
  reg,
  open,
  onToggle,
}: {
  reg: Registration;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="border-b border-slate-100 align-middle">
        <td className="px-2 py-2 font-mono font-semibold text-brand-700">
          {reg.regCode}
        </td>
        <td className="px-2 py-2">{reg.fullName}</td>
        <td className="px-2 py-2">{reg.mobile}</td>
        <td className="px-2 py-2">{reg.chennaiZone}</td>
        <td className="px-2 py-2 text-center">{reg.participants.length}</td>
        <td className="px-2 py-2 text-right">{formatINR(reg.totalAmount)}</td>
        <td className="px-2 py-2">
          <PaymentChip status={reg.paymentStatus} />
        </td>
        <td className="px-2 py-2 whitespace-nowrap text-slate-500">
          {fmtDate(reg.createdAt)}
        </td>
        <td className="px-2 py-2 text-right">
          <button
            onClick={onToggle}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            {open ? "Hide" : "View"}
          </button>
        </td>
      </tr>
      {open && (
        <tr className="bg-slate-50">
          <td colSpan={9} className="px-3 py-3">
            <ParticipantsTable participants={reg.participants} />
          </td>
        </tr>
      )}
    </>
  );
}

function RegCard({
  reg,
  open,
  onToggle,
}: {
  reg: Registration;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-sm font-semibold text-brand-700">
            {reg.regCode}
          </p>
          <p className="font-medium text-slate-900">{reg.fullName}</p>
          <p className="text-xs text-slate-500">{reg.mobile}</p>
        </div>
        <PaymentChip status={reg.paymentStatus} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-slate-600">
        <span>Zone: {reg.chennaiZone}</span>
        <span>Participants: {reg.participants.length}</span>
        <span>Amount: {formatINR(reg.totalAmount)}</span>
        <span>{fmtDate(reg.createdAt)}</span>
      </div>
      <button
        onClick={onToggle}
        className="mt-2 text-sm font-medium text-brand-600 hover:underline"
      >
        {open ? "Hide participants" : "View participants"}
      </button>
      {open && (
        <div className="mt-2 rounded-lg bg-slate-50 p-2">
          <ParticipantsTable participants={reg.participants} />
        </div>
      )}
    </div>
  );
}
