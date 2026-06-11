import Link from "next/link";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import Countdown from "@/components/site/Countdown";
import {
  EVENT,
  PRICING,
  REGISTRATION_BENEFITS,
  ACTIVITIES,
  FAQS,
} from "@/lib/constants";
import { formatINR } from "@/lib/pricing";

const SCHEDULE = [
  { time: "5:15 AM", title: "Reporting & Bib Collection", desc: "Check in at the venue and collect your bib and event T-shirt." },
  { time: "5:40 AM", title: "Group Warm-Up", desc: "Energising warm-up session led by fitness trainers." },
  { time: "6:00 AM", title: "Flag-Off", desc: "The 5K Walk/Jog begins through the city route." },
  { time: "7:30 AM", title: "Breakfast & Networking", desc: "Refuel and reconnect with fellow CIT alumni and families." },
  { time: "8:30 AM", title: "Prize Distribution & Closing", desc: "Celebrate achievements and wrap up the morning together." },
];

const OBJECTIVES = [
  "Strengthen bonds within the CIT alumni community in Chennai.",
  "Promote health, fitness and an active lifestyle.",
  "Create a fun, inclusive event for alumni, spouses and children.",
  "Build lasting memories through shared experiences.",
];

const HIGHLIGHTS = [
  { icon: "🏅", title: "Participation Medal", desc: "Every finisher takes home a keepsake medal." },
  { icon: "👕", title: "Event T-Shirt", desc: "An exclusive walk/jog tee for all participants." },
  { icon: "🥐", title: "Breakfast & Hydration", desc: "Post-walk breakfast and hydration support on site." },
  { icon: "📸", title: "Photography", desc: "Professional coverage to capture every moment." },
];

const BENEFIT_ICONS: Record<string, string> = {
  shirt: "👕",
  hash: "🔢",
  coffee: "☕",
  medal: "🏅",
  droplet: "💧",
  camera: "📸",
};

const SPONSOR_TILES = [
  { label: "Your Logo Here", featured: true },
  { label: "Sponsor" },
  { label: "Sponsor" },
  { label: "Your Logo Here", featured: true },
  { label: "Sponsor" },
  { label: "Partner" },
  { label: "Sponsor" },
  { label: "Your Logo Here", featured: true },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* ---------------- HERO ---------------- */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-900 text-white">
          {/* decorative shapes */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-500/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]"
          />

          <div className="container-x relative py-16 sm:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <span className="chip bg-white/15 text-white ring-1 ring-white/25 backdrop-blur">
                {EVENT.date} · Chennai - Besant Nagar
              </span>
              <h1 className="mt-5 text-4xl font-black leading-[1.1] tracking-tight sm:text-6xl">
                {EVENT.name}
              </h1>
              <p className="mt-4 text-lg font-medium text-white/85 sm:text-xl">
                {EVENT.tagline}
              </p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-accent-400">
                A 5K Walk/Jog for CIT alumni &amp; families
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/register" className="btn-accent w-full sm:w-auto">
                  Register Now
                </Link>
                <a href="#overview" className="btn-ghost w-full sm:w-auto">
                  View Details
                </a>
              </div>

              <div className="mt-12">
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/60">
                  Event starts in
                </p>
                <div className="mx-auto max-w-md">
                  <Countdown />
                </div>
              </div>
            </div>
          </div>

          {/* curved bottom edge */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-10 bg-slate-50 [clip-path:ellipse(75%_100%_at_50%_100%)]"
          />
        </section>

        {/* ---------------- OVERVIEW ---------------- */}
        <section id="overview" className="scroll-mt-24 py-16 sm:py-20">
          <div className="container-x">
            <header className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-brand-600">
                Event Overview
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                More than a run — a reunion in motion
              </h2>
            </header>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <div className="card">
                <h3 className="text-lg font-bold text-slate-900">Our Vision</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  To bring the CIT alumni family of Chennai together for a morning of
                  wellness, friendship and celebration — reconnecting old batchmates,
                  welcoming new generations, and building a community that walks
                  forward together.
                </p>
              </div>
              <div className="card">
                <h3 className="text-lg font-bold text-slate-900">Our Objectives</h3>
                <ul className="mt-3 space-y-2.5">
                  {OBJECTIVES.map((o) => (
                    <li key={o} className="flex gap-2.5 text-sm text-slate-600">
                      <span aria-hidden className="mt-0.5 text-brand-600">
                        ✔
                      </span>
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Highlights */}
            <div className="mt-12">
              <h3 className="text-center text-xl font-bold text-slate-900">
                Event Highlights
              </h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {HIGHLIGHTS.map((h) => (
                  <div key={h.title} className="card text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
                      <span aria-hidden>{h.icon}</span>
                    </div>
                    <h4 className="mt-3 text-sm font-bold text-slate-900">
                      {h.title}
                    </h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                      {h.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule timeline */}
            <div className="mt-12">
              <h3 className="text-center text-xl font-bold text-slate-900">
                Event Schedule
              </h3>
              <ol className="relative mx-auto mt-8 max-w-2xl border-l-2 border-brand-100 pl-6">
                {SCHEDULE.map((s) => (
                  <li key={s.time} className="relative pb-8 last:pb-0">
                    <span
                      aria-hidden
                      className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-brand-600 ring-4 ring-brand-100"
                    />
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                      <span className="chip w-fit bg-accent-500/10 font-bold text-accent-600">
                        {s.time}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">
                        {s.title}
                      </h4>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{s.desc}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ---------------- BENEFITS ---------------- */}
        <section id="benefits" className="scroll-mt-24 bg-white py-16 sm:py-20">
          <div className="container-x">
            <header className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-brand-600">
                What You Get
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Every registration includes
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                {formatINR(PRICING.ADULT)} per adult · {formatINR(PRICING.KID)} per kid
              </p>
            </header>

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {REGISTRATION_BENEFITS.map((b) => (
                <div
                  key={b.title}
                  className="card flex flex-col items-center gap-3 text-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-3xl">
                    <span aria-hidden>{BENEFIT_ICONS[b.icon] ?? "✨"}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">
                    {b.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- ACTIVITIES ---------------- */}
        <section id="activities" className="scroll-mt-24 py-16 sm:py-20">
          <div className="container-x">
            <header className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-brand-600">
                On The Day
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Activities &amp; experiences
              </h2>
            </header>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {ACTIVITIES.map((a) => (
                <div
                  key={a.title}
                  className="card group transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/25">
                    <span aria-hidden className="text-lg font-black">
                      {a.title.charAt(0)}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900">
                    {a.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {a.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- SPONSORS ---------------- */}
        <section className="bg-white py-16 sm:py-20">
          <div className="container-x">
            <header className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-brand-600">
                Powered By
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Our Sponsors
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                Proudly supported by partners who champion community and wellness.
              </p>
            </header>

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {SPONSOR_TILES.map((tile, i) => (
                <div
                  key={i}
                  className={`flex aspect-[3/2] items-center justify-center rounded-2xl border border-dashed text-center text-xs font-semibold uppercase tracking-wider transition ${tile.featured
                      ? "border-brand-200 bg-brand-50 text-brand-500 hover:bg-brand-100"
                      : "border-slate-200 bg-slate-50 text-slate-400 grayscale hover:grayscale-0"
                    }`}
                >
                  {tile.label}
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-sm text-slate-500">
              Interested in sponsoring?{" "}
              <a
                href="#contact"
                className="font-semibold text-brand-700 hover:text-brand-800"
              >
                Get in touch with our event heads.
              </a>
            </p>
          </div>
        </section>

        {/* ---------------- FAQ ---------------- */}
        <section id="faq" className="scroll-mt-24 py-16 sm:py-20">
          <div className="container-x">
            <header className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-brand-600">
                Good To Know
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Frequently asked questions
              </h2>
            </header>

            <div className="mx-auto mt-10 max-w-3xl space-y-3">
              {FAQS.map((f) => (
                <details
                  key={f.q}
                  className="card group [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-slate-900">
                    {f.q}
                    <span
                      aria-hidden
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- CONTACT ---------------- */}
        <section id="contact" className="scroll-mt-24 bg-white py-16 sm:py-20">
          <div className="container-x">
            <header className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-brand-600">
                Reach Out
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Contact our event heads
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                Have a question about the event, registration, or sponsorship? Our
                team is happy to help.
              </p>
            </header>

            <div className="mx-auto mt-10 grid max-w-2xl gap-5 sm:grid-cols-2">
              {EVENT.eventHeads.map((head) => (
                <div
                  key={head.name}
                  className="card flex items-center gap-4"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-xl font-black text-white">
                    {head.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900">
                      {head.name}
                    </p>
                    <p className="text-sm text-slate-500">{head.role}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-slate-500">
              Organised by {EVENT.organizer}.
            </p>
          </div>
        </section>

        {/* ---------------- FINAL CTA ---------------- */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-900 text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent-500/30 blur-3xl"
          />
          <div className="container-x relative py-16 text-center sm:py-20">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              Ready to walk with us?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">
              Lace up, bring the family, and join the CIT alumni community on{" "}
              {EVENT.date}.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register" className="btn-accent w-full sm:w-auto">
                Register Now
              </Link>
              <a href="#overview" className="btn-ghost w-full sm:w-auto">
                Explore the Event
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
