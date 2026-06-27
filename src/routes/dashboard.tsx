import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarCheck, Car, Download, Award, FileText, Bell, ArrowRight,
  Clock, MapPin, CheckCircle2, AlertCircle, Plus,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { fleet } from "@/data/fleet";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "My Dashboard — Modern Multi Services" }, { name: "description", content: "Your active rental, history, invoices and loyalty tier." }] }),
  component: Dashboard,
});

const tabs = ["Overview", "Bookings", "Invoices", "Documents"] as const;

function Dashboard() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const active = fleet[0];
  const history = [
    { id: "MMS-83A1", car: fleet[2], from: "2026-04-12", to: "2026-04-19", status: "Completed", total: 525 },
    { id: "MMS-7K2D", car: fleet[5], from: "2026-02-03", to: "2026-02-08", status: "Completed", total: 350 },
    { id: "MMS-6P9X", car: fleet[8], from: "2026-01-15", to: "2026-01-22", status: "Cancelled", total: 0 },
  ];

  return (
    <SiteLayout>
      <section className="border-b border-border bg-gradient-hero py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan">My account</p>
              <h1 className="mt-2 font-display text-3xl font-bold text-white md:text-5xl">Welcome back, Amiin.</h1>
              <p className="mt-2 text-white/75">You have 1 active rental and 2 completed trips.</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/5 px-5 py-3 backdrop-blur">
              <Award className="h-6 w-6 text-cyan" />
              <div>
                <p className="text-xs uppercase tracking-wider text-white/70">Loyalty tier</p>
                <p className="text-lg font-bold">Gold · 8% discount</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 md:px-8">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap border-b-2 px-4 py-4 text-sm font-medium transition ${
                tab === t ? "border-cyan text-cyan" : "border-transparent text-muted-foreground hover:text-navy"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          {tab === "Overview" && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Active rental */}
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card lg:col-span-2">
                <div className="border-b border-border bg-tint/40 px-6 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-cyan">Active rental</p>
                </div>
                <div className="grid gap-6 p-6 sm:grid-cols-[1fr_1.5fr]">
                  <img src={active.image} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
                  <div>
                    <h2 className="font-display text-xl font-bold">{active.name} {active.year}</h2>
                    <p className="text-xs text-muted-foreground">Reference · MMS-91K4</p>
                    <dl className="mt-4 space-y-2 text-sm">
                      <Row icon={CalendarCheck} k="Return by" v="2026-05-21 · 8:35 PM" />
                      <Row icon={Clock} k="Days remaining" v="3 days" />
                      <Row icon={MapPin} k="Pickup" v="Durdur Building, Hargeisa" />
                    </dl>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button className="rounded-full bg-gradient-cyan px-5 py-2 text-xs font-semibold text-white shadow-card">Extend rental</button>
                      <button className="rounded-full border border-border px-5 py-2 text-xs font-semibold text-navy hover:border-cyan">Report issue</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Notifications</h3>
                  <Bell className="h-4 w-4 text-cyan" />
                </div>
                <ul className="mt-4 space-y-3 text-sm">
                  <li className="flex gap-3"><CheckCircle2 className="h-4 w-4 text-cyan" /><div><p>Payment confirmed via Zaad</p><p className="text-xs text-muted-foreground">2 hours ago</p></div></li>
                  <li className="flex gap-3"><AlertCircle className="h-4 w-4 text-amber-500" /><div><p>Return reminder — 3 days left</p><p className="text-xs text-muted-foreground">Today</p></div></li>
                  <li className="flex gap-3"><Award className="h-4 w-4 text-cyan" /><div><p>You unlocked Gold tier</p><p className="text-xs text-muted-foreground">Yesterday</p></div></li>
                </ul>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 lg:col-span-3">
                {[
                  { l: "Total rentals", v: "12" },
                  { l: "Lifetime spend", v: "$3,420" },
                  { l: "Loyalty points", v: "284" },
                ].map((s) => (
                  <div key={s.l} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.l}</p>
                    <p className="mt-2 font-display text-2xl font-bold text-navy">{s.v}</p>
                  </div>
                ))}
              </div>

              <Link to="/fleet" className="lg:col-span-3 flex items-center justify-between rounded-2xl border border-dashed border-border bg-tint/30 px-6 py-5 text-sm font-medium text-navy hover:border-cyan hover:bg-tint/60">
                <span className="inline-flex items-center gap-2"><Plus className="h-4 w-4 text-cyan" /> Book another vehicle</span>
                <ArrowRight className="h-4 w-4 text-cyan" />
              </Link>
            </div>
          )}

          {tab === "Bookings" && (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
              <table className="w-full text-sm">
                <thead className="bg-tint text-left text-xs uppercase tracking-wider text-navy">
                  <tr>
                    <th className="px-5 py-4">Ref</th><th className="px-5 py-4">Vehicle</th><th className="px-5 py-4">Dates</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border bg-cyan/5">
                    <td className="px-5 py-4 font-mono text-xs">MMS-91K4</td>
                    <td className="px-5 py-4">{active.name} {active.year}</td>
                    <td className="px-5 py-4 text-muted-foreground">2026-05-13 → 2026-05-21</td>
                    <td className="px-5 py-4"><Badge tone="cyan">Active</Badge></td>
                    <td className="px-5 py-4 text-right font-semibold">$264</td>
                  </tr>
                  {history.map((h) => (
                    <tr key={h.id} className="border-t border-border">
                      <td className="px-5 py-4 font-mono text-xs">{h.id}</td>
                      <td className="px-5 py-4">{h.car.name} {h.car.year}</td>
                      <td className="px-5 py-4 text-muted-foreground">{h.from} → {h.to}</td>
                      <td className="px-5 py-4"><Badge tone={h.status === "Cancelled" ? "red" : "green"}>{h.status}</Badge></td>
                      <td className="px-5 py-4 text-right font-semibold">${h.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "Invoices" && (
            <div className="grid gap-4 md:grid-cols-2">
              {history.filter((h) => h.total > 0).map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 shadow-card">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-tint text-cyan"><FileText className="h-5 w-5" /></div>
                    <div>
                      <p className="text-sm font-semibold">Invoice {h.id}</p>
                      <p className="text-xs text-muted-foreground">{h.from} · {h.car.name}</p>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-cyan">
                    <Download className="h-3.5 w-3.5" /> PDF
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "Documents" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { l: "National ID", s: "Approved · expires 2030-03-12" },
                { l: "Driver's license", s: "Approved · expires 2028-07-04" },
                { l: "Deposit receipt", s: "On file" },
              ].map((d) => (
                <div key={d.l} className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 shadow-card">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-tint text-cyan"><FileText className="h-5 w-5" /></div>
                    <div>
                      <p className="text-sm font-semibold">{d.l}</p>
                      <p className="text-xs text-muted-foreground">{d.s}</p>
                    </div>
                  </div>
                  <Badge tone="green">Verified</Badge>
                </div>
              ))}
              <button className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-5 text-sm font-medium text-navy hover:border-cyan">
                <Plus className="h-4 w-4 text-cyan" /> Upload new document
              </button>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function Row({ icon: Icon, k, v }: { icon: typeof Car; k: string; v: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-cyan" />
      <span className="text-muted-foreground">{k}:</span>
      <span className="font-medium text-navy">{v}</span>
    </div>
  );
}
function Badge({ children, tone }: { children: React.ReactNode; tone: "green" | "red" | "cyan" }) {
  const map = {
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    cyan: "bg-cyan/15 text-cyan",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[tone]}`}>{children}</span>;
}
