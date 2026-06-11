import Link from "next/link";
import { EVENT } from "@/lib/constants";

const NAV_LINKS = [
  { href: "#overview", label: "Overview" },
  { href: "#benefits", label: "Benefits" },
  { href: "#activities", label: "Activities" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="container-x flex h-16 items-center justify-between gap-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label={`${EVENT.shortName} home`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-sm font-black text-white shadow-md shadow-brand-600/30">
            5K
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-extrabold tracking-tight text-slate-900">
              {EVENT.shortName}
            </span>
            <span className="hidden text-[11px] font-medium text-slate-500 sm:block">
              Walk / Jog
            </span>
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden flex-1 items-center justify-center md:flex"
        >
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <Link href="/register" className="btn-accent shrink-0 px-4 py-2.5 text-sm">
          Register Now
        </Link>
      </div>

      {/* Mobile: horizontally scrollable anchor links */}
      <nav
        aria-label="Section navigation"
        className="border-t border-slate-100 md:hidden"
      >
        <ul className="container-x flex items-center gap-1 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV_LINKS.map((link) => (
            <li key={link.href} className="shrink-0">
              <a
                href={link.href}
                className="block whitespace-nowrap rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
