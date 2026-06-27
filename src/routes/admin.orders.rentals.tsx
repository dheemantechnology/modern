import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { KeyRound, Undo2, CarFront, Clock, AlertTriangle, Eye, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Pill, statusTone, TableShell, EmptyState, StatCard } from "@/components/admin/ui";
import { BookingProfileDialog } from "@/components/admin/BookingProfileDialog";
import { AssignFleetUnitDialog } from "@/components/admin/AssignFleetUnitDialog";
import { RentalHandoverDialog } from "@/components/admin/RentalHandoverDialog";

export const Route = createFileRoute("/admin/orders/rentals")({ component: RentalOps });

function timeRemaining(end: string): { text: string; tone: "green" | "amber" | "red" } {
  const ms = new Date(end + "T23:59:59").getTime() - Date.now();
  if (ms <= 0) {
    const overdue = Math.ceil(Math.abs(ms) / 86400000);
    return { text: `${overdue}d overdue`, tone: "red" };
  }
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days >= 1) return { text: `${days}d ${hours}h left`, tone: days <= 1 ? "amber" : "green" };
  return { text: `${hours}h left`, tone: "amber" };
}

function RentalOps() {
  const today = new Date().toISOString().slice(0, 10);
  const [q, setQ] = useState("");
  const [view, setView] = useState<string | null>(null);
  const [assign, setAssign] = useState<string | null>(null);
  const [handover, setHandover] = useState<{ id: string; mode: "pickup" | "return" } | null>(null);

  const { data: rentals = [], isLoading } = useQuery({
    queryKey: ["rentals", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings")
        .select("id, reference, status, channel, start_date, end_date, total, pickup_location, pickup_at, returned_at, fleet_unit_id, vehicles(name, image_url), fleet_units(id, plate_number), customers(id, full_name, phone, license_no, avatar_url)")
        .in("status", ["confirmed", "active"] as any)
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 60_000,
  });

  const rows = useMemo(() => (rentals as any[]).filter((r) => {
    const s = q.toLowerCase().trim();
    if (!s) return true;
    return r.reference?.toLowerCase().includes(s)
      || r.customers?.full_name?.toLowerCase().includes(s)
      || r.vehicles?.name?.toLowerCase().includes(s)
      || r.fleet_units?.plate_number?.toLowerCase().includes(s);
  }), [rentals, q]);

  const pickups = rows.filter((r) => r.status === "confirmed" && !r.pickup_at && r.start_date <= today);
  const active = rows.filter((r) => r.status === "active" && !r.returned_at);
  const dueSoon = active.filter((r) => r.end_date <= today);
  const upcoming = rows.filter((r) => r.status === "confirmed" && r.start_date > today);

  return (
    <div>
      <PageHeader title="Rental Operations" subtitle="Customer onboarding · hand-over, on-road tracking and return inspection" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pickups today" value={pickups.length} icon={KeyRound} tone="amber" />
        <StatCard label="On the road" value={active.length} icon={CarFront} tone="cyan" />
        <StatCard label="Returns due / overdue" value={dueSoon.length} icon={AlertTriangle} tone="rose" />
        <StatCard label="Upcoming pickups" value={upcoming.length} icon={Clock} tone="emerald" />
      </div>

      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reference, customer, vehicle, plate…"
          className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm shadow-sm focus:border-cyan focus:outline-none" />
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <div className="space-y-8">
          <Section title="Ready for pickup" body="Confirmed bookings whose start date has arrived. Run through the pickup checklist to hand over the car." rows={pickups} empty="No pickups today."
            renderActions={(r) => r.fleet_unit_id ? (
              <button onClick={() => setHandover({ id: r.id, mode: "pickup" })} className="rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700">
                <KeyRound className="mr-1 inline h-3 w-3" /> Start pickup
              </button>
            ) : (
              <button onClick={() => setAssign(r.id)} className="rounded-md bg-amber-500 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-600">
                Assign plate first
              </button>
            )}
            setView={setView}
          />

          <Section title="On the road" body="Vehicles currently with customers. Click 'Return' when the customer brings it back." rows={active} empty="No active rentals right now."
            renderActions={(r) => (
              <button onClick={() => setHandover({ id: r.id, mode: "return" })}
                className={`rounded-md px-3 py-1.5 text-[11px] font-semibold text-white ${r.end_date <= today ? "bg-rose-500 hover:bg-rose-600" : "bg-cyan hover:bg-cyan/90"}`}>
                <Undo2 className="mr-1 inline h-3 w-3" /> Process return
              </button>
            )}
            setView={setView}
            showRemaining
          />

          <Section title="Upcoming" body="Confirmed pickups in the next few days. Assign a plate ahead of time to lock in the right car." rows={upcoming} empty="No upcoming pickups."
            renderActions={(r) => r.fleet_unit_id ? (
              <Pill tone="green">Ready · {r.fleet_units?.plate_number}</Pill>
            ) : (
              <button onClick={() => setAssign(r.id)} className="rounded-md bg-amber-500 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-600">Assign plate</button>
            )}
            setView={setView}
          />
        </div>
      )}

      <BookingProfileDialog bookingId={view} onClose={() => setView(null)} />
      <AssignFleetUnitDialog bookingId={assign} onClose={() => setAssign(null)} />
      <RentalHandoverDialog bookingId={handover?.id ?? null} mode={handover?.mode ?? "pickup"} onClose={() => setHandover(null)} />
    </div>
  );
}

function Section({ title, body, rows, empty, renderActions, setView, showRemaining }: {
  title: string; body: string; rows: any[]; empty: string;
  renderActions: (r: any) => React.ReactNode;
  setView: (id: string) => void;
  showRemaining?: boolean;
}) {
  return (
    <section>
      <div className="mb-2">
        <h2 className="font-display text-base font-bold text-navy">{title} <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{rows.length}</span></h2>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={CarFront} title={empty} body="" />
      ) : (
        <TableShell>
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
            <tr>
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Vehicle · Plate</th>
              <th className="px-4 py-3">Window</th>
              {showRemaining && <th className="px-4 py-3">Remaining</th>}
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const remain = showRemaining ? timeRemaining(r.end_date) : null;
              return (
                <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs">{r.reference}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">
                      {r.customers?.id ? (
                        <Link to="/admin/customers/$customerId" params={{ customerId: r.customers.id }} className="hover:text-cyan">
                          {r.customers.full_name}
                        </Link>
                      ) : "—"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{r.customers?.phone ?? ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">{r.vehicles?.name ?? "—"}</div>
                    <div className="text-[11px] font-mono text-emerald-700">
                      {r.fleet_units?.id ? (
                        <Link to="/admin/fleet/vehicles/$unitId" params={{ unitId: r.fleet_units.id }} className="hover:underline">
                          {r.fleet_units.plate_number}
                        </Link>
                      ) : "no plate"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.start_date} → {r.end_date}</td>
                  {showRemaining && remain && (
                    <td className="px-4 py-3"><Pill tone={remain.tone}>{remain.text}</Pill></td>
                  )}
                  <td className="px-4 py-3"><Pill tone={statusTone(r.status)}>{r.status}</Pill></td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      {renderActions(r)}
                      <button onClick={() => setView(r.id)} className="rounded p-1.5 hover:bg-muted" title="Open profile">
                        <Eye className="h-4 w-4 text-cyan" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}
    </section>
  );
}