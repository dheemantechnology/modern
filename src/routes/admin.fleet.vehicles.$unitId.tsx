import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Car, Wrench, Plus, Calendar, ShieldCheck, FileText, Gauge, DollarSign, Trash2, Pencil, Eye, CalendarRange, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Pill, statusTone, TableShell, EmptyState } from "@/components/admin/ui";
import { FormDialog, FieldGroup, Input, Select as FDSelect, Textarea, PrimaryButton, GhostButton } from "@/components/admin/FormDialog";
import { confirmDelete, notifyDeleted, notifyError } from "@/lib/swal";
import { BookingProfileDialog } from "@/components/admin/BookingProfileDialog";

export const Route = createFileRoute("/admin/fleet/vehicles/$unitId")({ component: UnitProfile });

type MaintRow = {
  id: string; fleet_unit_id: string; kind: string; title: string; description: string | null;
  cost: number; odometer: number | null; vendor: string | null;
  performed_at: string; next_due_at: string | null; status: string;
};

function UnitProfile() {
  const { unitId } = Route.useParams();
  const qc = useQueryClient();
  const [editMaint, setEditMaint] = useState<Partial<MaintRow> | null>(null);
  const [viewBooking, setViewBooking] = useState<string | null>(null);

  const { data: unit, isLoading } = useQuery({
    queryKey: ["fleet_unit", unitId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("fleet_units").select("*").eq("id", unitId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: type } = useQuery({
    queryKey: ["fleet_unit_type", unit?.vehicle_id],
    enabled: !!unit?.vehicle_id,
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("*").eq("id", unit!.vehicle_id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: maint = [] } = useQuery<MaintRow[]>({
    queryKey: ["maintenance", unitId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("maintenance_records").select("*").eq("fleet_unit_id", unitId).order("performed_at", { ascending: false });
      if (error) throw error;
      return data as MaintRow[];
    },
  });

  const { data: rentals = [] } = useQuery({
    queryKey: ["unit-rentals", unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, reference, status, start_date, end_date, days, total, pickup_at, returned_at, customers(id, full_name, phone)")
        .eq("fleet_unit_id", unitId)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const saveMaint = useMutation({
    mutationFn: async (m: Partial<MaintRow>) => {
      if (!m.title?.trim()) throw new Error("Title is required");
      const payload: any = {
        fleet_unit_id: unitId,
        kind: m.kind ?? "service",
        title: m.title.trim(),
        description: m.description ?? null,
        cost: Number(m.cost ?? 0),
        odometer: m.odometer != null && (m.odometer as any) !== "" ? Number(m.odometer) : null,
        vendor: m.vendor ?? null,
        performed_at: m.performed_at || new Date().toISOString().slice(0, 10),
        next_due_at: m.next_due_at || null,
        status: m.status ?? "completed",
      };
      if (m.id) {
        const { error } = await (supabase as any).from("maintenance_records").update(payload).eq("id", m.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("maintenance_records").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["maintenance", unitId] }); qc.invalidateQueries({ queryKey: ["maintenance"] }); setEditMaint(null); toast.success("Maintenance record saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const delMaint = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("maintenance_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance", unitId] }),
    onError: (e: any) => notifyError(e.message),
  });

  async function handleDeleteMaint(m: MaintRow) {
    const ok = await confirmDelete({ itemLabel: m.title, description: "This maintenance record will be removed." });
    if (!ok) return;
    await delMaint.mutateAsync(m.id);
    await notifyDeleted(m.title);
  }

  if (isLoading || !unit) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const totalCost = maint.reduce((s, m) => s + Number(m.cost || 0), 0);
  const completedRentals = (rentals as any[]).filter((r) => ["completed", "active"].includes(r.status));
  const revenue = completedRentals.reduce((s, r) => s + Number(r.total || 0), 0);
  const rentalDays = completedRentals.reduce((s, r) => s + Number(r.days || 0), 0);
  const currentRental = (rentals as any[]).find((r) => r.status === "active");

  return (
    <div className="space-y-6">
      <Link to="/admin/fleet/vehicles" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-cyan">
        <ArrowLeft className="h-3.5 w-3.5" /> All vehicles
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy to-blue text-white shadow-card">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20 blur-3xl bg-gradient-to-br from-cyan to-transparent" />
        <div className="relative grid gap-6 p-6 md:grid-cols-[280px_1fr] md:p-8">
          <div className="overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
            {unit.photo_url || type?.image_url ? (
              <img src={unit.photo_url ?? type?.image_url} alt="" className="aspect-video w-full object-cover" />
            ) : (
              <div className="flex aspect-video items-center justify-center"><Car className="h-12 w-12 text-white/40" /></div>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Pill tone={statusTone(unit.status)}>{unit.status}</Pill>
              {type?.category && <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold">{type.category}</span>}
            </div>
            <div>
              <p className="font-mono text-3xl font-bold tracking-wider">{unit.plate_number}</p>
              <h1 className="mt-1 font-display text-xl font-bold">{type?.name ?? "—"}</h1>
              <p className="text-sm text-white/60">{type?.make} {type?.model} · {type?.year ?? "—"} · {unit.color ?? "—"}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat icon={Gauge} label="Mileage" value={`${Number(unit.mileage).toLocaleString()} km`} />
              <Stat icon={CalendarRange} label="Rentals" value={`${rentals.length} (${rentalDays}d)`} />
              <Stat icon={DollarSign} label="Revenue" value={`$${revenue.toLocaleString()}`} />
              <Stat icon={Wrench} label="Maintenance" value={`$${totalCost.toFixed(0)} · ${maint.length}`} />
            </div>
          </div>
        </div>
      </div>

      {currentRental && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan/30 bg-cyan/5 p-4">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan text-white"><User className="h-4 w-4" /></div>
            <div>
              <p className="font-semibold text-navy">Currently rented to {currentRental.customers?.full_name ?? "—"}</p>
              <p className="text-xs text-muted-foreground">{currentRental.start_date} → {currentRental.end_date} · {currentRental.reference}</p>
            </div>
          </div>
          <button onClick={() => setViewBooking(currentRental.id)} className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
            Open rental
          </button>
        </div>
      )}

      {/* Compliance & purchase */}
      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard icon={ShieldCheck} title="Insurance expiry" value={unit.insurance_expiry ?? "Not set"} tone={dateTone(unit.insurance_expiry)} />
        <InfoCard icon={FileText} title="Registration expiry" value={unit.registration_expiry ?? "Not set"} tone={dateTone(unit.registration_expiry)} />
        <InfoCard icon={Calendar} title="Purchased" value={unit.purchase_date ? `${unit.purchase_date}${unit.purchase_price ? ` · $${Number(unit.purchase_price).toLocaleString()}` : ""}` : "Not set"} />
      </div>

      {unit.notes && (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Internal notes</p>
          <p className="mt-2 text-sm text-navy whitespace-pre-wrap">{unit.notes}</p>
        </div>
      )}

      {/* Rental history */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-navy">Rental history</h2>
            <p className="text-xs text-muted-foreground">All bookings ever assigned to this plate. Click any row to open the booking.</p>
          </div>
        </div>
        {(rentals as any[]).length === 0 ? (
          <EmptyState icon={CalendarRange} title="No rentals yet" body="When this vehicle is assigned to a booking it will appear here." />
        ) : (
          <TableShell>
            <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
              <tr>
                <th className="px-4 py-3">Ref</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Days</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Open</th>
              </tr>
            </thead>
            <tbody>
              {(rentals as any[]).map((r) => (
                <tr key={r.id} onClick={() => setViewBooking(r.id)} className="cursor-pointer border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs">{r.reference}</td>
                  <td className="px-4 py-3 text-sm">{r.customers?.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.start_date} → {r.end_date}</td>
                  <td className="px-4 py-3 text-sm">{r.days ?? "—"}</td>
                  <td className="px-4 py-3"><Pill tone={statusTone(r.status)}>{String(r.status).replace("_", " ")}</Pill></td>
                  <td className="px-4 py-3 text-right font-semibold">${Number(r.total).toFixed(0)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={(e) => { e.stopPropagation(); setViewBooking(r.id); }} className="rounded p-1.5 hover:bg-cyan/10"><Eye className="h-4 w-4 text-cyan" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </div>

      {/* Maintenance log */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-navy">Maintenance history</h2>
            <p className="text-xs text-muted-foreground">Service, repairs, inspections, insurance renewals.</p>
          </div>
          <PrimaryButton onClick={() => setEditMaint({ kind: "service", performed_at: new Date().toISOString().slice(0, 10), odometer: unit.mileage })}>
            <Plus className="h-4 w-4" /> Add record
          </PrimaryButton>
        </div>
        {maint.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No maintenance recorded yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {maint.map((m) => (
              <li key={m.id} className="flex items-start gap-4 p-5 hover:bg-muted/20">
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan/10 text-cyan">
                  <Wrench className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-navy">{m.title}</p>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{m.kind}</span>
                  </div>
                  {m.description && <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{m.performed_at}</span>
                    {m.vendor && <span>· {m.vendor}</span>}
                    {m.odometer != null && <span>· {Number(m.odometer).toLocaleString()} km</span>}
                    {m.next_due_at && <span>· next due {m.next_due_at}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-navy">${Number(m.cost).toFixed(0)}</p>
                  <div className="mt-1 flex gap-1">
                    <button onClick={() => setEditMaint(m)} className="rounded p-1 hover:bg-cyan/10"><Pencil className="h-3.5 w-3.5 text-cyan" /></button>
                    <button onClick={() => handleDeleteMaint(m)} className="rounded p-1 hover:bg-rose-100"><Trash2 className="h-3.5 w-3.5 text-rose-600" /></button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FormDialog
        open={!!editMaint}
        onClose={() => setEditMaint(null)}
        title={editMaint?.id ? "Edit maintenance record" : "New maintenance record"}
        subtitle={`For ${unit.plate_number}`}
        footer={
          <>
            <GhostButton onClick={() => setEditMaint(null)}>Cancel</GhostButton>
            <PrimaryButton form="maint-form" type="submit" disabled={saveMaint.isPending}>{saveMaint.isPending ? "Saving…" : "Save record"}</PrimaryButton>
          </>
        }
      >
        {editMaint && (
          <form id="maint-form" onSubmit={(e) => { e.preventDefault(); saveMaint.mutate(editMaint); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Type">
                <FDSelect value={editMaint.kind ?? "service"} onChange={(e) => setEditMaint({ ...editMaint, kind: e.target.value })}>
                  <option value="service">Service</option>
                  <option value="repair">Repair</option>
                  <option value="inspection">Inspection</option>
                  <option value="insurance">Insurance renewal</option>
                  <option value="registration">Registration renewal</option>
                  <option value="other">Other</option>
                </FDSelect>
              </FieldGroup>
              <FieldGroup label="Performed on" required><Input required type="date" value={editMaint.performed_at ?? ""} onChange={(e) => setEditMaint({ ...editMaint, performed_at: e.target.value })} /></FieldGroup>
            </div>
            <FieldGroup label="Title" required>
              <Input required value={editMaint.title ?? ""} onChange={(e) => setEditMaint({ ...editMaint, title: e.target.value })} placeholder="Engine oil change" />
            </FieldGroup>
            <FieldGroup label="Description"><Textarea value={editMaint.description ?? ""} onChange={(e) => setEditMaint({ ...editMaint, description: e.target.value })} placeholder="Parts replaced, observations…" /></FieldGroup>
            <div className="grid grid-cols-3 gap-3">
              <FieldGroup label="Cost (USD)"><Input type="number" min={0} value={editMaint.cost ?? 0} onChange={(e) => setEditMaint({ ...editMaint, cost: Number(e.target.value) })} /></FieldGroup>
              <FieldGroup label="Odometer (km)"><Input type="number" min={0} value={(editMaint.odometer as any) ?? ""} onChange={(e) => setEditMaint({ ...editMaint, odometer: e.target.value as any })} /></FieldGroup>
              <FieldGroup label="Vendor"><Input value={editMaint.vendor ?? ""} onChange={(e) => setEditMaint({ ...editMaint, vendor: e.target.value })} placeholder="Workshop name" /></FieldGroup>
            </div>
            <FieldGroup label="Next due" hint="Optional — used for service reminders">
              <Input type="date" value={editMaint.next_due_at ?? ""} onChange={(e) => setEditMaint({ ...editMaint, next_due_at: e.target.value })} />
            </FieldGroup>
          </form>
        )}
      </FormDialog>

      <BookingProfileDialog bookingId={viewBooking} onClose={() => setViewBooking(null)} />
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
      <div className="flex items-center gap-2 text-white/60"><Icon className="h-3.5 w-3.5" /><span className="text-[10px] uppercase tracking-wider">{label}</span></div>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

function InfoCard({ icon: Icon, title, value, tone }: { icon: any; title: string; value: string; tone?: "warn" | "ok" | "danger" }) {
  const toneClass = tone === "warn" ? "border-amber-300 bg-amber-50" : tone === "danger" ? "border-rose-300 bg-rose-50" : "border-border bg-card";
  return (
    <div className={`rounded-xl border p-5 ${toneClass}`}>
      <div className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-wider">{title}</span></div>
      <p className="mt-2 text-sm font-bold text-navy">{value}</p>
    </div>
  );
}

function dateTone(d: string | null): "warn" | "danger" | undefined {
  if (!d) return undefined;
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  if (days < 0) return "danger";
  if (days < 30) return "warn";
  return undefined;
}