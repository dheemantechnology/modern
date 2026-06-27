import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Car, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/reports")({ component: ReportsAdmin });

function ReportsAdmin() {
  const { data } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const [{ data: payments }, { data: bookings }, { data: vehicles }, { data: customers }] = await Promise.all([
        supabase.from("payments").select("amount, status, created_at"),
        supabase.from("bookings").select("id, total, vehicle_id, status, created_at, vehicles(name)"),
        supabase.from("vehicles").select("id, name, status"),
        supabase.from("customers").select("id, created_at"),
      ]);

      const months: Record<string, number> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months[d.toISOString().slice(0, 7)] = 0;
      }
      (payments ?? []).filter((p) => p.status === "paid").forEach((p) => {
        const k = (p.created_at as string).slice(0, 7);
        if (k in months) months[k] += Number(p.amount);
      });
      const monthly = Object.entries(months).map(([m, v]) => ({ month: m.slice(5), revenue: v }));

      const counts: Record<string, { name: string; count: number; revenue: number }> = {};
      (bookings ?? []).forEach((b: any) => {
        const k = b.vehicle_id || "unknown";
        const n = b.vehicles?.name || "Unknown";
        if (!counts[k]) counts[k] = { name: n, count: 0, revenue: 0 };
        counts[k].count += 1;
        counts[k].revenue += Number(b.total ?? 0);
      });
      const topVehicles = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);

      const totalRev = (payments ?? []).filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
      const utilization = (vehicles ?? []).length ? Math.round(100 * ((vehicles ?? []).filter((v) => v.status === "rented").length / vehicles!.length)) : 0;

      return { monthly, topVehicles, totalRev, utilization, vCount: vehicles?.length ?? 0, cCount: customers?.length ?? 0 };
    },
  });

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Business performance at a glance" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total revenue" value={`$${(data?.totalRev ?? 0).toLocaleString()}`} icon={TrendingUp} tone="emerald" />
        <StatCard label="Fleet utilization" value={`${data?.utilization ?? 0}%`} icon={Car} tone="cyan" />
        <StatCard label="Vehicles" value={data?.vCount ?? "—"} icon={Car} tone="amber" />
        <StatCard label="Customers" value={data?.cCount ?? "—"} icon={Users} tone="rose" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-semibold text-navy">Monthly revenue</h3>
          <p className="text-xs text-muted-foreground">Last 6 months</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <LineChart data={data?.monthly ?? []}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-semibold text-navy">Top vehicles</h3>
          <p className="text-xs text-muted-foreground">By number of bookings</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart data={data?.topVehicles ?? []}>
                <CartesianGrid stroke="#eee" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0f1b3d" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-cyan" /><h3 className="font-semibold text-navy">Vehicle leaderboard</h3></div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="py-2">#</th><th>Vehicle</th><th className="text-right">Bookings</th><th className="text-right">Revenue</th></tr></thead>
          <tbody>
            {(data?.topVehicles ?? []).map((v, i) => (
              <tr key={v.name} className="border-t border-border">
                <td className="py-2.5 font-mono text-xs">{i + 1}</td>
                <td className="font-medium text-navy">{v.name}</td>
                <td className="text-right">{v.count}</td>
                <td className="text-right font-semibold">${v.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}