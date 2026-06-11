import Link from "next/link";
import { EVENT } from "@/lib/constants";
import RegistrationForm from "./RegistrationForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen pb-28">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container-x flex items-center justify-between py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-700"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Home
          </Link>
          <span className="chip bg-brand-50 text-brand-700">{EVENT.shortName}</span>
        </div>
      </header>

      <section className="container-x pt-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Register for the {EVENT.shortName}
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          {EVENT.tagline} · {EVENT.date}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Add yourself and your family in one go. It takes under two minutes.
        </p>
      </section>

      <RegistrationForm />
    </main>
  );
}
