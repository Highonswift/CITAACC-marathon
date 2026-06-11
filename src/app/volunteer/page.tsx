import { hasRole } from "@/lib/auth";
import { EVENT } from "@/lib/constants";
import VolunteerLogin from "./VolunteerLogin";
import VolunteerScanner from "./VolunteerScanner";

export const dynamic = "force-dynamic";

export default async function VolunteerPage() {
  const authed = await hasRole("volunteer");

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container-x flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-base text-white">
              📷
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">Volunteer Portal</p>
              <p className="text-xs text-slate-500">{EVENT.shortName}</p>
            </div>
          </div>
          <span
            className={`chip ${
              authed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {authed ? "Signed in" : "Sign in"}
          </span>
        </div>
      </header>

      <div className="container-x py-6">
        {authed ? <VolunteerScanner /> : <VolunteerLogin />}
      </div>
    </main>
  );
}
