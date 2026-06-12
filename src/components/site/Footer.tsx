import Link from "next/link";
import { EVENT } from "@/lib/constants";

const QUICK_LINKS = [
  { href: "#overview", label: "Overview" },
  { href: "#benefits", label: "Benefits" },
  { href: "#activities", label: "Activities" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-x py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-sm font-black text-white">
                5K
              </span>
              <span className="text-sm font-extrabold tracking-tight text-slate-900">
                {EVENT.shortName}
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
              {EVENT.name}
            </p>
            <p className="mt-3 text-sm text-slate-500">{EVENT.organizer}</p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
              <span aria-hidden>📅</span>
              {EVENT.date}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Quick Links</h3>
            <ul className="mt-4 space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-600 transition hover:text-brand-700"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Get Started</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  href="/register"
                  className="text-sm font-semibold text-brand-700 transition hover:text-brand-800"
                >
                  Register Now
                </Link>
              </li>
              <li>
                <Link
                  href="/my-registration"
                  className="text-sm text-slate-600 transition hover:text-brand-700"
                >
                  Find My Registration
                </Link>
              </li>
              <li>
                <a
                  href="#contact"
                  className="text-sm text-slate-600 transition hover:text-brand-700"
                >
                  Contact Event Heads
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            © {year} {EVENT.organizer}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Registration fees are non-refundable.</span>
            <Link href="/volunteer" className="transition hover:text-slate-600">
              Volunteer
            </Link>
            <Link href="/admin" className="transition hover:text-slate-600">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
