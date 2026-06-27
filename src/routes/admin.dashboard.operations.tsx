import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Car, CalendarCheck, AlertTriangle, TrendingUp, Wrench, Activity, Zap, Clock,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, BarChart, Bar, Legend, CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { StatCard, PageHeader, Pill, statusTone, TableShell } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/dashboard/operations")({
  component: OperationsDashboard,
});

function OperationsDashboard() {
  const { data } = useQuery({
    queryKey: ["ops-dashboard"],
    queryFn: async () => {
      const [vehicles, bookings, payments] = await Promise.all([
        supabase.from("vehicles").select("id, name, status, category, daily_rate"),
        supabase.from("bookings").select("id, reference, status, start_date, end_date, days, total, created_at, vehicles(name, category)"),
        supabase.from("payments").select("amount, status, method, created_at"),
      ]);
      return {
        vehicles: vehicles.data ?? [],
        bookings: bookings.data ?? [],
        payments: payments.data ?? [],
      };
    },
  });

  const vehicles = data?.vehicles ?? [];
  const bookings = data?.bookings ?? [];
  const payments = data?.payments ?? [];

  const total = vehicles.length || 1;
  const rented = vehicles.filter((v: any) => v.status === "rented").length;
  const available = vehicles.filter((v: any) => v.status === "available").length;
  const maint = vehicles.filter((v: any) => v.status === "maintenance").length;
  const utilization = Math.round((rented / total) * 100);

  // Bookings funnel
  const funnel = [
    { stage: "Inquiries", count: bookings.length },
    { stage: "Pending", count: bookings.filter((b: any) => b.status === "pending_approval").length },
    { stage: "Confirmed", count: bookings.filter((b: any) => b.status === "confirmed").length },
    { stage: "Active", count: bookings.filter((b: any) => b.status === "active").length },
    { stage: "Completed", count: bookings.filter((b: any) => b.status === "completed").length },
  ];

  // Revenue by category
  const byCat: Record<string, number> = {};
  bookings.forEach((b: any) => {
    const c = b.vehicles?.category ?? "Other";
    byCat[c] = (byCat[c] ?? 0) + Number(b.total ?? 0);
  });
  const catData = Object.entries(byCat).map(([category, revenue]) => ({ category, revenue }));

  // 14-day revenue trend
  const trend: { date: string; revenue: number; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const day = payments.filter((p: any) => p.status === "paid" && (p.created_at as string).slice(0, 10) === key);
    trend.push({
      date: key.slice(5),
      revenue: day.reduce((s, p: any) => s + Number(p.amount ?? 0), 0),
      count: day.length,
    });
  }

  const activeBookings = bookings.filter((b: any) => b.status === "active").slice(0, 6);

  return (
    <div>
      <PageHeader
        title="Operations Dashboard"
        subtitle="Real-time view of fleet, bookings and revenue performance"
        actions={
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Activity className="h-3 w-3" /> Live data
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Fleet utilization" value={`${utilization}%`} hint={`${rented}/${total} rented`} icon={Zap} tone="cyan" />
        <StatCard label="Available now" value={available} hint="Ready to dispatch" icon={Car} tone="emerald" />
        <StatCard label="In maintenance" value={maint} hint="Out of service" icon={Wrench} tone="amber" />
        <StatCard label="Active rentals" value={bookings.filter((b: any) => b.status === "active").length} hint="On the road" icon={CalendarCheck} tone="rose" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-navy">Revenue & transactions</h3>
              <p className="text-xs text-muted-foreground">Last 14 days · paid only</p>
            </div>
            <TrendingUp className="h-5 w-5 text-cyan" />
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#06b6d4" fill="url(#rev2)" strokeWidth={2} name="Revenue ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h3 className="font-display text-lg font-bold text-navy">Utilization gauge</h3>
          <p className="text-xs text-muted-foreground">Target: 75%</p>
          <div className="h-56">
            <ResponsiveContainer>
              <RadialBarChart
                innerRadius="60%"
                outerRadius="100%"
                data={[{ name: "util", value: utilization, fill: "#06b6d4" }]}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar background dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <p className="-mt-12 text-center font-display text-3xl font-bold text-navy">{utilization}%</p>
          <p className="mt-10 text-center text-xs text-muted-foreground">{rented} of {total} vehicles rented</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h3 className="font-display text-lg font-bold text-navy">Bookings funnel</h3>
          <p className="text-xs text-muted-foreground">Pipeline by stage</p>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={funnel}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="stage" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#0e7490" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h3 className="font-display text-lg font-bold text-navy">Revenue by category</h3>
          <p className="text-xs text-muted-foreground">Bookings total ($)</p>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={catData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis type="category" dataKey="category" tickLine={false} axisLine={false} fontSize={11} width={90} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#06b6d4" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <h3 className="font-display text-lg font-bold text-navy">Active rentals on the road</h3>
          <Pill tone="cyan"><Clock className="mr-1 inline h-3 w-3" /> Live</Pill>
        </div>
        {activeBookings.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-amber-500" /> No active rentals.
          </div>
        ) : (
          <TableShell>
            <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
              <tr>
                <th className="px-6 py-3">Ref</th>
                <th className="px-6 py-3">Vehicle</th>
                <th className="px-6 py-3">Period</th>
                <th className="px-6 py-3">Days</th>
                <th className="px-6 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {activeBookings.map((b: any) => (
                <tr key={b.id} className="border-t border-border">
                  <td className="px-6 py-3 font-mono text-xs">{b.reference}</td>
                  <td className="px-6 py-3">{b.vehicles?.name ?? "—"}</td>
                  <td className="px-6 py-3 text-xs text-muted-foreground">{b.start_date} → {b.end_date}</td>
                  <td className="px-6 py-3">{b.days ?? "—"}</td>
                  <td className="px-6 py-3 text-right font-semibold">${Number(b.total ?? 0).toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </div>
    </div>
  );
}
