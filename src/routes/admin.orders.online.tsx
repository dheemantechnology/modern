import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Globe, Eye, CreditCard, Clock, CheckCircle2, RotateCcw, Search, AlertCircle, Car } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Pill, statusTone, TableShell, EmptyState, StatCard } from "@/components/admin/ui";
import { BookingProfileDialog, approveAndExecuteRefund, rejectRefund } from "@/components/admin/BookingProfileDialog";
import { AssignFleetUnitDialog } from "@/components/admin/AssignFleetUnitDialog";
import { swal } from "@/lib/swal";

export const Route = createFileRoute("/admin/orders/online")({ component: OnlineOrders });

function OnlineOrders() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "pending_approval" | "confirmed" | "active" | "completed" | "cancelled">("all");
  const [view, setView] = useState<string | null>(null);
  const [assign, setAssign] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", "online", filter],
    queryFn: async () => {
      let query = supabase.from("bookings")
        .select("*, vehicles(name, image_url), fleet_units(id, plate_number), customers(id, full_name, email, phone), payments(id, amount, status, refund_status, gateway_ref, refund_amount, refund_reason)")
        .eq("channel", "online")
        .order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter as any);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return orders;
    return (orders as any[]).filter((o) =>
      o.reference?.toLowerCase().includes(s) ||
      o.customers?.full_name?.toLowerCase().includes(s) ||
      o.vehicles?.name?.toLowerCase().includes(s),
    );
  }, [orders, q]);

  const stats = useMemo(() => {
    const o = orders as any[];
    return {
      total: o.length,
      pending: o.filter((x) => x.status === "pending_approval").length,
      paid: o.filter((x) => (x.payments ?? []).some((p: any) => p.status === "paid" && Number(p.amount) > 0)).length,
      refundQ: o.reduce((n, x) => n + ((x.payments ?? []).filter((p: any) => p.refund_status === "requested").length), 0),
    };
  }, [orders]);

  const refundAction = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "reject" }) => {
      if (action === "approve") await approveAndExecuteRefund(id); else await rejectRefund(id);
    },
    onSuccess: async (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["booking-payments"] });
      if (vars.action === "approve") {
        await swal.fire({ icon: "success", title: "Refund sent to customer", text: "Gateway returned funds to the customer's account.", timer: 2400, showConfirmButton: false });
      } else {
        toast.success("Refund rejected");
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Online Bookings" subtitle="Customer self-service reservations · gateway capture & refund" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total online" value={stats.total} icon={Globe} tone="cyan" />
        <StatCard label="Pending approval" value={stats.pending} icon={Clock} tone="amber" />
        <StatCard label="Captured" value={stats.paid} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Refund queue" value={stats.refundQ} icon={RotateCcw} tone="rose" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reference, customer, vehicle…"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm shadow-sm focus:border-cyan focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg bg-card p-1 border border-border">
          {(["all", "pending_approval", "confirmed", "active", "completed", "cancelled"] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${filter === s ? "bg-cyan text-navy" : "text-muted-foreground hover:bg-muted"}`}>
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : filtered.length === 0 ? (
        <EmptyState icon={Globe} title="No online bookings" body="Customer-created reservations will appear here." />
      ) : (
        <TableShell>
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
            <tr><th className="px-4 py-3">Ref</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Vehicle</th><th className="px-4 py-3">Plate</th><th className="px-4 py-3">Dates</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Booking</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map((b: any) => {
              const captured = (b.payments ?? []).find((p: any) => p.status === "paid" && Number(p.amount) > 0);
              const refundReq = (b.payments ?? []).find((p: any) => p.refund_status === "requested");
              return (
                <tr key={b.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs">{b.reference}</td>
                  <td className="px-4 py-3">
                    {b.customers?.id ? (
                      <Link to="/admin/customers/$customerId" params={{ customerId: b.customers.id }} className="font-medium text-navy hover:text-cyan">
                        {b.customers.full_name}
                      </Link>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">{b.vehicles?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    {b.fleet_units?.plate_number ? (
                      <Link to="/admin/fleet/vehicles/$unitId" params={{ unitId: b.fleet_units.id }} className="rounded bg-emerald-50 px-2 py-0.5 font-mono font-semibold text-emerald-700 hover:bg-emerald-100">
                        {b.fleet_units.plate_number}
                      </Link>
                    ) : (
                      <button onClick={() => setAssign(b.id)} className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 hover:bg-amber-100">
                        <Car className="h-3 w-3" /> Assign
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{b.start_date} → {b.end_date}</td>
                  <td className="px-4 py-3 font-semibold">${Number(b.total).toFixed(0)}</td>
                  <td className="px-4 py-3"><Pill tone={statusTone(b.status)}>{b.status.replace("_", " ")}</Pill></td>
                  <td className="px-4 py-3">
                    {captured ? <Pill tone="green">Captured</Pill> : <Pill tone="amber">Awaiting</Pill>}
                    {refundReq && <span className="ml-1"><Pill tone="amber">Refund req.</Pill></span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {refundReq && (
                      <>
                        <button onClick={() => refundAction.mutate({ id: refundReq.id, action: "approve" })}
                          className="mr-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700">Approve refund</button>
                        <button onClick={() => refundAction.mutate({ id: refundReq.id, action: "reject" })}
                          className="mr-1 rounded-md bg-rose-500 px-2 py-1 text-[11px] font-semibold text-white hover:bg-rose-600">Reject</button>
                      </>
                    )}
                    {b.fleet_units?.plate_number && (
                      <button onClick={() => setAssign(b.id)} className="mr-1 rounded p-1.5 hover:bg-muted" title="Reassign plate">
                        <Car className="h-4 w-4 text-amber-600" />
                      </button>
                    )}
                    <button onClick={() => setView(b.id)} className="rounded p-1.5 hover:bg-muted" title="Open profile">
                      <Eye className="h-4 w-4 text-cyan" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}

      <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <AlertCircle className="h-3.5 w-3.5" /> Payment gateway is simulated. Connect a real provider in Settings.
      </div>

      <BookingProfileDialog bookingId={view} onClose={() => setView(null)} />
      <AssignFleetUnitDialog bookingId={assign} onClose={() => setAssign(null)} />
    </div>
  );
}