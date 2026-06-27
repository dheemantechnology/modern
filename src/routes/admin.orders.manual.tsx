import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Plus, Eye, Search, XCircle, Car } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Pill, statusTone, TableShell, EmptyState, StatCard } from "@/components/admin/ui";
import { FormDialog, FieldGroup, Input, Select, Textarea, PrimaryButton, GhostButton } from "@/components/admin/FormDialog";
import { BookingProfileDialog } from "@/components/admin/BookingProfileDialog";
import { AssignFleetUnitDialog } from "@/components/admin/AssignFleetUnitDialog";
import { swal } from "@/lib/swal";
import { pickDailyRate, normalizeTiers, formatTierLabel } from "@/lib/rateTiers";

export const Route = createFileRoute("/admin/orders/manual")({ component: ManualOrders });

function ManualOrders() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [view, setView] = useState<string | null>(null);
  const [assign, setAssign] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", "manual"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings")
        .select("*, vehicles(name), fleet_units(plate_number), customers(full_name, phone), payments(id, amount, status)")
        .eq("channel", "manual")
        .order("created_at", { ascending: false });
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

  const cancelBooking = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data: b } = await supabase.from("bookings").select("*, payments(*)").eq("id", id).maybeSingle();
      if (!b) throw new Error("Not found");
      const captured = (b.payments ?? []).find((p: any) => p.status === "paid" && Number(p.amount) > 0);
      const { error } = await supabase.from("bookings").update({
        status: "cancelled" as any,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || null,
      }).eq("id", id);
      if (error) throw error;
      if (captured) {
        await supabase.from("payments").insert({
          booking_id: id,
          amount: -Number(captured.amount),
          method: captured.method,
          status: "refunded" as any,
          paid_at: new Date().toISOString(),
          parent_payment_id: captured.id,
          transaction_ref: `MANUAL-REFUND-${captured.id.slice(0, 6)}`,
          refund_reason: reason || "Manual cancellation",
        });
        await supabase.from("payments").update({ status: "refunded" as any, refund_status: "refunded", refund_amount: Number(captured.amount), refund_approved_at: new Date().toISOString() }).eq("id", captured.id);
      }
    },
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      await swal.fire({ icon: "success", title: "Booking cancelled", text: "Any cash payment has been recorded as refunded.", timer: 1800, showConfirmButton: false });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Bookings (Manual)"
        subtitle="Walk-in and call-in reservations · direct payment, no gateway"
        actions={<button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-gradient-cyan px-4 py-2 text-sm font-semibold text-white shadow-card hover:shadow-lg"><Plus className="h-4 w-4" /> New booking + payment</button>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total" value={(orders as any[]).length} icon={ClipboardList} tone="cyan" />
        <StatCard label="Active" value={(orders as any[]).filter((o) => o.status === "active" || o.status === "confirmed").length} icon={ClipboardList} tone="emerald" />
        <StatCard label="Cancelled" value={(orders as any[]).filter((o) => o.status === "cancelled").length} icon={XCircle} tone="rose" />
      </div>

      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
          className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm shadow-sm focus:border-cyan focus:outline-none" />
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No manual bookings" body="Click 'New booking + payment' to add one." />
      ) : (
        <TableShell>
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
            <tr><th className="px-4 py-3">Ref</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Vehicle</th><th className="px-4 py-3">Plate</th><th className="px-4 py-3">Dates</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map((b: any) => (
              <tr key={b.id} className="border-t border-border hover:bg-muted/20">
                <td className="px-4 py-3 font-mono text-xs">{b.reference}</td>
                <td className="px-4 py-3">{b.customers?.full_name ?? "—"}</td>
                <td className="px-4 py-3">{b.vehicles?.name ?? "—"}</td>
                <td className="px-4 py-3 text-xs">
                  {b.fleet_units?.plate_number ? (
                    <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono font-semibold text-emerald-700">{b.fleet_units.plate_number}</span>
                  ) : (
                    <button onClick={() => setAssign(b.id)} className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 hover:bg-amber-100">
                      <Car className="h-3 w-3" /> Assign
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{b.start_date} → {b.end_date}</td>
                <td className="px-4 py-3 font-semibold">${Number(b.total).toFixed(0)}</td>
                <td className="px-4 py-3"><Pill tone={statusTone(b.status)}>{b.status.replace("_", " ")}</Pill></td>
                <td className="px-4 py-3 text-right">
                  {b.status !== "cancelled" && b.status !== "completed" && (
                    <button onClick={async () => {
                      const res = await swal.fire({ title: "Cancel booking?", input: "text", inputPlaceholder: "Reason (optional)", showCancelButton: true, confirmButtonText: "Cancel booking", icon: "warning", iconColor: "#e11d48" });
                      if (res.isConfirmed) cancelBooking.mutate({ id: b.id, reason: res.value || "" });
                    }} className="mr-1 inline-flex items-center gap-1 rounded-md bg-rose-500 px-2 py-1 text-[11px] font-semibold text-white hover:bg-rose-600">
                      <XCircle className="h-3 w-3" /> Cancel
                    </button>
                  )}
                  <button onClick={() => setView(b.id)} className="rounded p-1.5 hover:bg-muted" title="Open profile"><Eye className="h-4 w-4 text-cyan" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <BookingProfileDialog bookingId={view} onClose={() => setView(null)} />
      <AssignFleetUnitDialog bookingId={assign} onClose={() => setAssign(null)} />
      {addOpen && <NewManualOrderDialog onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function NewManualOrderDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [fleetUnitId, setFleetUnitId] = useState("");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [days, setDays] = useState<number>(1);
  const [dailyRate, setDailyRate] = useState<number>(0);
  const [pickup, setPickup] = useState("");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState("cash");
  const [paidNow, setPaidNow] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [paidOverridden, setPaidOverridden] = useState(false);

  const { data: customers = [] } = useQuery({
    queryKey: ["lookup-customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id, full_name, phone").order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["lookup-vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("id, name, daily_rate, rate_tiers").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: fleetUnits = [] } = useQuery({
    queryKey: ["lookup-fleet-units", vehicleId],
    enabled: !!vehicleId,
    queryFn: async () => {
      const { data, error } = await supabase.from("fleet_units")
        .select("id, plate_number, status, mileage")
        .eq("vehicle_id", vehicleId)
        .eq("status", "available")
        .order("plate_number");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Keep end_date in sync whenever start or days changes
  function setStartAndSync(newStart: string) {
    setStart(newStart);
    const s = new Date(newStart);
    s.setDate(s.getDate() + Math.max(1, days) - 1);
    setEnd(s.toISOString().slice(0, 10));
  }
  function setDaysAndSync(n: number) {
    const d = Math.max(1, Math.floor(n || 1));
    setDays(d);
    const s = new Date(start);
    s.setDate(s.getDate() + d - 1);
    setEnd(s.toISOString().slice(0, 10));
  }
  function setEndAndSync(newEnd: string) {
    setEnd(newEnd);
    const s = new Date(start).getTime();
    const e = new Date(newEnd).getTime();
    setDays(Math.max(1, Math.ceil((e - s) / 86400000) + 1));
  }
  const selectedVehicle = (vehicles as any[]).find((v) => v.id === vehicleId);
  const tiers = normalizeTiers(selectedVehicle?.rate_tiers ?? []);
  // Re-apply tier rate whenever days change (only if vehicle has tiers and rate hasn't been manually overridden to a non-tier value)
  const [rateOverridden, setRateOverridden] = useState(false);
  const autoRate = selectedVehicle ? pickDailyRate(selectedVehicle.rate_tiers, days, selectedVehicle.daily_rate) : 0;
  useEffect(() => {
    if (selectedVehicle && !rateOverridden) setDailyRate(autoRate);
  }, [autoRate, selectedVehicle?.id, rateOverridden]);

  const required = useMemo(() => Number(dailyRate) * days, [dailyRate, days]);
  const total = useMemo(() => Math.max(0, required - Number(discount || 0)), [required, discount]);
  const balance = useMemo(() => Math.max(0, total - Number(paidNow || 0)), [total, paidNow]);

  // Auto-fill Total paid with (Required - Discount) unless the user has edited it
  useEffect(() => {
    if (!paidOverridden) setPaidNow(total);
  }, [total, paidOverridden]);

  const create = useMutation({
    mutationFn: async () => {
      if (!customerId || !vehicleId) throw new Error("Customer and vehicle required");
      const { data: { user } } = await supabase.auth.getUser();
      const { data: b, error: e1 } = await supabase.from("bookings").insert({
        customer_id: customerId,
        vehicle_id: vehicleId,
        fleet_unit_id: fleetUnitId || null,
        start_date: start,
        end_date: end,
        daily_rate: dailyRate,
        total,
        pickup_location: pickup || null,
        notes: notes || null,
        channel: "manual",
        status: "confirmed" as any,
        created_by: user?.id ?? null,
        approved_by: user?.id ?? null,
        approved_at: new Date().toISOString(),
      } as any).select().single();
      if (e1) throw e1;
      if (paidNow > 0) {
        await supabase.from("payments").insert({
          booking_id: b.id,
          amount: paidNow,
          method,
          status: (paidNow >= total ? "paid" : "pending") as any,
          paid_at: paidNow > 0 ? new Date().toISOString() : null,
          transaction_ref: `MANUAL-${b.reference}`,
        });
        await supabase.from("invoices").insert({ booking_id: b.id, amount: paidNow });
      }
      return b;
    },
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      onClose();
      await swal.fire({ icon: "success", title: "Booking created", text: "Manual booking and payment recorded.", timer: 1800, showConfirmButton: false });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <FormDialog
      open
      onClose={onClose}
      title="New manual booking"
      subtitle="Walk-in or call-in reservation with direct payment"
      size="lg"
      footer={
        <>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? "Saving…" : `Save & charge $${paidNow.toFixed(2)}`}
          </PrimaryButton>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Customer" required>
          <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Select customer…</option>
            {(customers as any[]).map((c) => <option key={c.id} value={c.id}>{c.full_name} {c.phone ? `· ${c.phone}` : ""}</option>)}
          </Select>
        </FieldGroup>
        <FieldGroup label="Vehicle" required>
          <Select value={vehicleId} onChange={(e) => {
            const v = (vehicles as any[]).find((x) => x.id === e.target.value);
            setVehicleId(e.target.value);
            setFleetUnitId("");
            setRateOverridden(false);
            if (v) setDailyRate(pickDailyRate(v.rate_tiers, days, v.daily_rate));
          }}>
            <option value="">Select vehicle…</option>
            {(vehicles as any[]).map((v) => <option key={v.id} value={v.id}>{v.name} · ${Number(v.daily_rate).toFixed(0)}/day</option>)}
          </Select>
        </FieldGroup>
        <FieldGroup label="Plate (specific car)">
          <Select value={fleetUnitId} onChange={(e) => setFleetUnitId(e.target.value)} disabled={!vehicleId}>
            <option value="">{vehicleId ? "Select a plate (optional now)…" : "Pick a vehicle first"}</option>
            {(fleetUnits as any[]).map((u) => (
              <option key={u.id} value={u.id}>{u.plate_number} · {u.mileage?.toLocaleString() ?? 0} km</option>
            ))}
          </Select>
        </FieldGroup>
        <div />
        <FieldGroup label="Start date" required><Input type="date" value={start} onChange={(e) => setStartAndSync(e.target.value)} /></FieldGroup>
        <FieldGroup label="Number of days" required><Input type="number" min={1} value={days} onChange={(e) => setDaysAndSync(Number(e.target.value))} /></FieldGroup>
        <FieldGroup label="End date"><Input type="date" value={end} onChange={(e) => setEndAndSync(e.target.value)} /></FieldGroup>
        <FieldGroup label={tiers.length ? `Daily rate (auto-tier for ${days}d)` : "Daily rate"}>
          <Input type="number" step="0.01" value={dailyRate} onChange={(e) => { setRateOverridden(true); setDailyRate(Number(e.target.value)); }} />
        </FieldGroup>
        <FieldGroup label="Pickup location"><Input value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Office / airport / address" /></FieldGroup>
        <div />
        <div className="sm:col-span-2"><FieldGroup label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></FieldGroup></div>

        {tiers.length > 0 && (
          <div className="sm:col-span-2 rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-2">Price sheet for this vehicle</p>
            <div className="flex flex-wrap gap-2">
              {tiers.map((t, i) => {
                const active = days >= t.min_days && (t.max_days == null || days <= t.max_days);
                return (
                  <span key={i} className={`rounded-md px-2 py-1 text-xs font-semibold ${active ? "bg-cyan text-white" : "bg-white text-navy ring-1 ring-border"}`}>
                    {formatTierLabel(t)} · ${t.daily_rate.toFixed(0)}/d
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="sm:col-span-2 rounded-xl border border-cyan/30 bg-cyan/5 p-4">
          <p className="text-xs uppercase tracking-wider text-cyan font-bold">Direct payment</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <FieldGroup label="Required amount">
              <Input type="number" value={required.toFixed(2)} readOnly />
            </FieldGroup>
            <FieldGroup label="Discount">
              <Input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
            </FieldGroup>
            <FieldGroup label="Method">
              <Select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="zaad">Zaad</option>
                <option value="edahab">E-dahab</option>
                <option value="bank">Bank transfer</option>
              </Select>
            </FieldGroup>
            <FieldGroup label="Total paid">
              <Input
                type="number"
                step="0.01"
                value={paidNow}
                onChange={(e) => { setPaidOverridden(true); setPaidNow(Number(e.target.value)); }}
                placeholder={String(total)}
              />
            </FieldGroup>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 border-t border-cyan/20 pt-3">
            <div>
              <p className="text-xs text-muted-foreground">Required ({days}d × ${Number(dailyRate).toFixed(2)})</p>
              <p className="font-display text-lg font-bold text-navy">${required.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total after discount</p>
              <p className="font-display text-lg font-bold text-navy">${total.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Net balance</p>
              <p className={`font-display text-lg font-bold ${balance > 0 ? "text-rose-600" : "text-emerald-600"}`}>${balance.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </FormDialog>
  );
}