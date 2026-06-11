import { hasRole } from "@/lib/auth";
import { EVENT } from "@/lib/constants";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await hasRole("admin");

  if (!authed) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="container-x py-10">
          <AdminLogin />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="container-x flex flex-col gap-1 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Organizer Dashboard
            </h1>
            <p className="text-sm text-slate-500">{EVENT.shortName}</p>
          </div>
          <div id="admin-header-actions" className="flex items-center gap-2" />
        </div>
      </header>
      <div className="container-x py-6">
        <AdminDashboard />
      </div>
    </main>
  );
}
