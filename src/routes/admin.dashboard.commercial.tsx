import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users, ShoppingCart, DollarSign, Repeat, Award, Crown, TrendingUp, ArrowRight,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { StatCard, PageHeader, Pill, statusTone, TableShell } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/dashboard/commercial")({
  component: CommercialDashboard,
});

const COLORS = ["#06b6d4", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];

function CommercialDashboard() {
  const { data } = useQuery({
    queryKey: ["commercial-dashboard"],
    queryFn: async () => {
      const [customers, bookings, payments] = await Promise.all([
        supabase.from("customers").select("id, full_name, email, phone, loyalty_tier, kyc_status, city, created_at, avatar_url"),
        supabase.from("bookings").select("id, reference, total, status, days, created_at, customer_id, vehicles(name, category), customers(full_name)").order("created_at", { ascending: false }),
        supabase.from("payments").select("id, amount, method, status, created_at"),
      ]);
      return {
        customers: customers.data ?? [],
        bookings: bookings.data ?? [],
        payments: payments.data ?? [],
      };
    },
  });

  const customers = data?.customers ?? [];
  const bookings = data?.bookings ?? [];
  const payments = data?.payments ?? [];

  const paidPayments = payments.filter((p: any) => p.status === "paid");
  const revenue = paidPayments.reduce((s, p: any) => s + Number(p.amount ?? 0), 0);
  const completedBookings = bookings.filter((b: any) => b.status === "completed").length;
  const aov = completedBookings ? revenue / completedBookings : 0;

  // Top customers
  const customerSpend: Record<string, { name: string; total: number; count: number; tier?: string }> = {};
  bookings.forEach((b: any) => {
    if (!b.customer_id) return;
    const key = b.customer_id;
    const name = b.customers?.full_name ?? "—";
    customerSpend[key] = customerSpend[key] ?? { name, total: 0, count: 0 };
    customerSpend[key].total += Number(b.total ?? 0);
    customerSpend[key].count += 1;
  });
  customers.forEach((c: any) => {
    if (customerSpend[c.id]) customerSpend[c.id].tier = c.loyalty_tier;
  });
  const topCustomers = Object.values(customerSpend).sort((a, b) => b.total - a.total).slice(0, 6);

  // Repeat customer rate
  const repeatCount = Object.values(customerSpend).filter((c) => c.count > 1).length;
  const repeatRate = customers.length ? Math.round((repeatCount / customers.length) * 100) : 0;

  // Payment method mix
  const methodMix: Record<string, number> = {};
  paidPayments.forEach((p: any) => {
    methodMix[p.method] = (methodMix[p.method] ?? 0) + Number(p.amount ?? 0);
  });
  const methodData = Object.entries(methodMix).map(([name, value]) => ({ name, value }));

  // Loyalty distribution
  const loyalty: Record<string, number> = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
  customers.forEach((c: any) => { loyalty[c.loyalty_tier ?? "bronze"] = (loyalty[c.loyalty_tier ?? "bronze"] ?? 0) + 1; });
  const loyaltyData = Object.entries(loyalty).map(([tier, count]) => ({ tier, count }));

  // Monthly orders trend (last 6 months)
  const monthly: { month: string; orders: number; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const m = bookings.filter((b: any) => (b.created_at as string).slice(0, 7) === key);
    monthly.push({
      month: d.toLocaleString("en", { month: "short" }),
      orders: m.length,
      revenue: m.reduce((s, b: any) => s + Number(b.total ?? 0), 0),
    });
  }

  const recentOrders = bookings.slice(0, 8);

  return (
    <div>
      <PageHeader title="Commercial Dashboard" subtitle="Customer behavior, orders and revenue performance" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total revenue" value={`$${revenue.toLocaleString()}`} hint="All paid transactions" icon={DollarSign} tone="emerald" />
        <StatCard label="Total customers" value={customers.length} hint={`${repeatCount} returning`} icon={Users} tone="cyan" />
        <StatCard label="Avg order value" value={`$${aov.toFixed(0)}`} hint="Per completed booking" icon={ShoppingCart} tone="amber" />
        <StatCard label="Repeat rate" value={`${repeatRate}%`} hint="Customers with 2+ orders" icon={Repeat} tone="rose" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-navy">Orders & revenue · last 6 months</h3>
              <p className="text-xs text-muted-foreground">Monthly performance</p>
            </div>
            <TrendingUp className="h-5 w-5 text-cyan" />
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="orders" name="Orders" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="right" dataKey="revenue" name="Revenue ($)" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h3 className="font-display text-lg font-bold text-navy">Payment methods</h3>
          <p className="text-xs text-muted-foreground">By revenue ($)</p>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={methodData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
                  {methodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs">
            {methodData.map((m, i) => (
              <li key={m.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="capitalize text-muted-foreground">{m.name}</span>
                <span className="ml-auto font-semibold text-navy">${m.value.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-3">
            <h3 className="font-display text-lg font-bold text-navy">Top customers</h3>
            <Crown className="h-4 w-4 text-amber-500" />
          </div>
          <ul className="divide-y divide-border">
            {topCustomers.length === 0 && (
              <li className="p-10 text-center text-sm text-muted-foreground">No customer revenue yet.</li>
            )}
            {topCustomers.map((c, i) => (
              <li key={i} className="flex items-center gap-3 px-6 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-navy font-bold text-white">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-navy">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.count} {c.count === 1 ? "order" : "orders"} · <span className="capitalize">{c.tier ?? "bronze"}</span> tier</p>
                </div>
                <p className="font-display font-bold text-navy">${c.total.toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h3 className="font-display text-lg font-bold text-navy">Loyalty distribution</h3>
          <p className="text-xs text-muted-foreground">Customers per tier</p>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={loyaltyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis type="category" dataKey="tier" tickLine={false} axisLine={false} fontSize={11} width={70} tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <h3 className="font-display text-lg font-bold text-navy">Recent orders</h3>
          <Link to="/admin/bookings" className="inline-flex items-center gap-1 text-xs font-semibold text-cyan hover:underline">
            All orders <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <TableShell>
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
            <tr>
              <th className="px-6 py-3">Ref</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Vehicle</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.length === 0 && (
              <tr><td colSpan={5} className="p-10 text-center text-sm text-muted-foreground">No orders yet.</td></tr>
            )}
            {recentOrders.map((b: any) => (
              <tr key={b.id} className="border-t border-border">
                <td className="px-6 py-3 font-mono text-xs">{b.reference}</td>
                <td className="px-6 py-3">{b.customers?.full_name ?? "—"}</td>
                <td className="px-6 py-3 text-muted-foreground">{b.vehicles?.name ?? "—"}</td>
                <td className="px-6 py-3"><Pill tone={statusTone(b.status)}>{String(b.status).replace("_", " ")}</Pill></td>
                <td className="px-6 py-3 text-right font-semibold">${Number(b.total ?? 0).toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>
    </div>
  );
}
