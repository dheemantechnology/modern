import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck, CreditCard, ArrowRight, Sparkles, ShieldCheck,
  Car, FileText, Users, BarChart3, LayoutDashboard, TrendingUp, ClipboardList,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { PageHeader, Pill, statusTone } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/")({
  component: UserDashboard,
});

function UserDashboard() {
  const { user, roles, isAdmin } = useAuth();
  const greeting = greetingFor();
  const name = (user?.email ?? "there").split("@")[0];

  const { data } = useQuery({
    queryKey: ["my-dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ count: myBookings }, { data: myRecent }, { count: openBookings }, { count: paymentsToday }] = await Promise.all([
        supabase.from("bookings").select("*", { count: "exact", head: true }).eq("created_by", user!.id),
        supabase.from("bookings").select("id, reference, status, start_date, end_date, total, vehicles(name)").eq("created_by", user!.id).order("created_at", { ascending: false }).limit(4),
        supabase.from("bookings").select("*", { count: "exact", head: true }).in("status", ["pending_approval", "confirmed"]),
        supabase.from("payments").select("*", { count: "exact", head: true }).gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      ]);
      return {
        myBookings: myBookings ?? 0,
        myRecent: myRecent ?? [],
        openBookings: openBookings ?? 0,
        paymentsToday: paymentsToday ?? 0,
      };
    },
  });

  return (
    <div>
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy to-cyan p-8 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-cyan/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-cyan">
            <Sparkles className="h-4 w-4" /> {greeting}
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Welcome back, {name}.</h1>
          <p className="mt-2 max-w-xl text-sm text-white/80">
            Your personal command center. Jump into the workflows you use every day, or open one of the analytics dashboards.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/admin/dashboard/operations" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-navy shadow hover:bg-cyan hover:text-white">
              <BarChart3 className="h-4 w-4" /> Operations dashboard
            </Link>
            <Link to="/admin/dashboard/commercial" className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/20">
              <TrendingUp className="h-4 w-4" /> Commercial dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Mini label="My bookings" value={data?.myBookings ?? "—"} icon={CalendarCheck} />
        <Mini label="Open in queue" value={data?.openBookings ?? "—"} icon={ClipboardList} />
        <Mini label="Payments today" value={data?.paymentsToday ?? "—"} icon={CreditCard} />
        <Mini label="My role" value={isAdmin ? "Administrator" : (roles[0] ?? "Staff")} icon={ShieldCheck} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h3 className="font-display text-lg font-bold text-navy">Quick actions</h3>
          <p className="text-xs text-muted-foreground">The fastest way to get work done</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <QuickAction to="/admin/bookings" icon={CalendarCheck} title="New booking" hint="Reserve a vehicle for a customer" />
            <QuickAction to="/admin/customers" icon={Users} title="Add customer" hint="Onboard with KYC" />
            <QuickAction to="/admin/fleet" icon={Car} title="Add vehicle" hint="Expand the fleet" />
            <QuickAction to="/admin/payments" icon={CreditCard} title="Record payment" hint="Zaad, E-dahab, cash" />
            <QuickAction to="/admin/reports" icon={FileText} title="Run a report" hint="Revenue, utilization, more" />
            <QuickAction to="/admin/cms/home" icon={LayoutDashboard} title="Edit website" hint="Update home or about" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-navy">My recent bookings</h3>
            <Link to="/admin/bookings" className="text-xs font-semibold text-cyan hover:underline">All</Link>
          </div>
          <ul className="mt-3 space-y-2">
            {(data?.myRecent ?? []).length === 0 && (
              <li className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                You haven't created bookings yet.
              </li>
            )}
            {(data?.myRecent ?? []).map((b: any) => (
              <li key={b.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy">{b.vehicles?.name ?? "Vehicle"}</p>
                  <p className="text-xs text-muted-foreground">{b.reference} · {b.start_date}</p>
                </div>
                <Pill tone={statusTone(b.status)}>{String(b.status).replace("_", " ")}</Pill>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value, icon: Icon }: { label: string; value: any; icon: any }) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-cyan hover:shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan/10 text-cyan transition group-hover:bg-cyan group-hover:text-white">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 font-display text-2xl font-bold text-navy">{value}</p>
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, hint }: { to: string; icon: any; title: string; hint: string }) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-xl border border-border p-4 transition hover:-translate-y-0.5 hover:border-cyan hover:shadow">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan/10 text-cyan transition group-hover:bg-cyan group-hover:text-white">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-navy">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-cyan" />
    </Link>
  );
}

function greetingFor() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
