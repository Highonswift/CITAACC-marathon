import { EVENT } from "@/lib/constants";

export interface PassCardProps {
  qrDataUrl: string;
  fullName: string;
  bibNumber: string;
  category: "ADULT" | "KID";
  tshirtSize: string;
  age: number;
  gender: string;
  regCode: string;
  payerName: string;
  attendanceStatus: "NOT_CHECKED_IN" | "PRESENT";
  tshirtStatus: "PENDING" | "DISTRIBUTED";
  passUrl: string;
}

function genderLabel(g: string): string {
  const map: Record<string, string> = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };
  return map[g] ?? g;
}

export default function PassCard({
  qrDataUrl,
  fullName,
  bibNumber,
  category,
  tshirtSize,
  age,
  gender,
  regCode,
  payerName,
  attendanceStatus,
  tshirtStatus,
  passUrl,
}: PassCardProps) {
  const isPresent = attendanceStatus === "PRESENT";
  const tshirtDone = tshirtStatus === "DISTRIBUTED";
  const categoryLabel = category === "ADULT" ? "Adult" : "Kid";

  return (
    <article
      id="event-pass"
      className="pass-print-target overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200"
    >
      {/* Brand gradient header */}
      <div className="relative bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-6 pb-7 pt-6 text-white">
        <div className="absolute right-4 top-4 chip bg-white/15 text-white ring-1 ring-white/25 backdrop-blur">
          Digital Pass
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
          {EVENT.organizer.split(" – ")[1] ?? "Event Pass"}
        </p>
        <h1 className="mt-1 text-xl font-extrabold leading-tight sm:text-2xl">
          {EVENT.name}
        </h1>
        <p className="mt-1 text-sm text-white/80">{EVENT.tagline}</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-sm font-medium ring-1 ring-white/20">
          <span aria-hidden>📅</span>
          <span>{EVENT.date}</span>
        </div>
      </div>

      {/* Perforation divider */}
      <div className="relative h-0">
        <span className="absolute -left-3 top-0 h-6 w-6 -translate-y-1/2 rounded-full bg-slate-50" />
        <span className="absolute -right-3 top-0 h-6 w-6 -translate-y-1/2 rounded-full bg-slate-50" />
        <span className="absolute inset-x-5 top-0 -translate-y-1/2 border-t-2 border-dashed border-slate-200" />
      </div>

      {/* Body */}
      <div className="px-6 pb-6 pt-7">
        {/* Name + Bib */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Participant
            </p>
            <p className="truncate text-2xl font-extrabold text-slate-900">{fullName}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="chip bg-brand-50 text-brand-700">{categoryLabel}</span>
              <span className="chip bg-slate-100 text-slate-600">{age} yrs</span>
              <span className="chip bg-slate-100 text-slate-600">{genderLabel(gender)}</span>
            </div>
          </div>
          <div className="shrink-0 rounded-2xl bg-accent-500 px-4 py-3 text-center text-white shadow-lg shadow-accent-500/25">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/80">
              Bib No.
            </p>
            <p className="text-xl font-black leading-none tracking-tight">{bibNumber}</p>
          </div>
        </div>

        {/* QR */}
        <div className="mt-6 flex flex-col items-center rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt={`QR code for ${fullName}`}
            width={220}
            height={220}
            className="h-52 w-52 rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200"
          />
          <p className="mt-3 text-center text-xs text-slate-500">
            Show this QR at the venue for check-in &amp; T-shirt collection
          </p>
        </div>

        {/* Details grid */}
        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-100">
          <div className="bg-white p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Category
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-slate-900">{categoryLabel}</dd>
          </div>
          <div className="bg-white p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              T-Shirt Size
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-slate-900">{tshirtSize}</dd>
          </div>
          <div className="bg-white p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Reg Code
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-slate-900">{regCode}</dd>
          </div>
          <div className="bg-white p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Registered By
            </dt>
            <dd className="mt-0.5 truncate text-sm font-semibold text-slate-900">{payerName}</dd>
          </div>
        </dl>

        {/* Status chips */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span
            className={`chip gap-1.5 ${
              isPresent ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            <span aria-hidden>{isPresent ? "✓" : "•"}</span>
            {isPresent ? "Checked In" : "Not Checked In"}
          </span>
          <span
            className={`chip gap-1.5 ${
              tshirtDone ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            <span aria-hidden>👕</span>
            {tshirtDone ? "T-Shirt Collected" : "T-Shirt Pending"}
          </span>
        </div>

        <p className="mt-5 break-all text-center text-[11px] text-slate-400">{passUrl}</p>
      </div>
    </article>
  );
}
