import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Car, Search, ExternalLink, LayoutGrid, List as ListIcon, Gauge, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Pill, statusTone, TableShell, EmptyState } from "@/components/admin/ui";
import { FormDialog, FieldGroup, Input, Select as FDSelect, Textarea, PrimaryButton, GhostButton } from "@/components/admin/FormDialog";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { confirmDelete, notifyDeleted, notifyError } from "@/lib/swal";

type Unit = {
  id: string; vehicle_id: string; plate_number: string; vin: string | null;
  color: string | null; mileage: number; status: string;
  purchase_date: string | null; purchase_price: number | null;
  insurance_expiry: string | null; registration_expiry: string | null;
  photo_url: string | null; notes: string | null;
};
type VehicleType = { id: string; name: string; image_url: string | null; category: string | null };

function KPI({ label, value, accent }: { label: string; value: number; accent: "navy" | "emerald" | "cyan" | "amber" }) {
  const ring = { navy: "from-navy/10 to-navy/5 text-navy", emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-700", cyan: "from-cyan/10 to-cyan/5 text-cyan", amber: "from-amber-500/10 to-amber-500/5 text-amber-700" }[accent];
  return (
    <div className={`rounded-xl border border-border bg-gradient-to-br ${ring} p-4`}>
      <p className="text-[10px] uppercase tracking-wider font-semibold opacity-70">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function cssColor(name: string | null): string {
  if (!name) return "#cbd5e1";
  const k = name.toLowerCase();
  if (k.includes("white") || k.includes("pearl") || k.includes("champagne") || k.includes("beige") || k.includes("sand")) return "#f1f5f9";
  if (k.includes("black") || k.includes("onyx")) return "#0f172a";
  if (k.includes("silver") || k.includes("grey") || k.includes("gray")) return "#94a3b8";
  if (k.includes("red") || k.includes("rose")) return "#dc2626";
  if (k.includes("blue") || k.includes("cosmic")) return "#2563eb";
  if (k.includes("green") || k.includes("forest")) return "#16a34a";
  return "#94a3b8";
}

function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <div className="flex items-center justify-center gap-1 text-muted-foreground">{icon}<span className="text-[9px] uppercase tracking-wider">{label}</span></div>
      <p className="mt-0.5 text-xs font-semibold text-navy truncate">{value}</p>
    </div>
  );
}

function VehicleCard({ unit, type, onEdit, onDelete }: { unit: Unit; type?: VehicleType; onEdit: () => void; onDelete: () => void }) {
  const tone = unit.status === "available" ? "from-emerald-500/90 to-teal-600/90" : unit.status === "rented" ? "from-cyan/90 to-blue-600/90" : unit.status === "maintenance" ? "from-amber-500/90 to-orange-600/90" : "from-slate-500/90 to-slate-700/90";
  const insExpiry = unit.insurance_expiry ? Math.ceil((new Date(unit.insurance_expiry).getTime() - Date.now()) / 86400000) : null;
  const expiringSoon = insExpiry != null && insExpiry < 30;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-xl hover:-translate-y-0.5">
      <div className="relative h-44 overflow-hidden bg-muted">
        {unit.photo_url || type?.image_url ? (
          <img src={unit.photo_url ?? type?.image_url ?? ""} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center"><Car className="h-12 w-12 text-muted-foreground/40" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />
        <div className={`absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${tone} px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md`}>
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          {unit.status}
        </div>
        {expiringSoon && (
          <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-1 text-[10px] font-bold text-white shadow-md" title="Insurance expiring soon">
            <AlertTriangle className="h-3 w-3" /> {insExpiry}d
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-xs text-white/70 truncate">{type?.name ?? "—"}{type?.category ? ` · ${type.category}` : ""}</p>
          <p className="font-mono text-2xl font-bold tracking-wider text-white drop-shadow-lg">{unit.plate_number}</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <Mini icon={<span className="h-3 w-3 rounded-full inline-block ring-1 ring-border" style={{ backgroundColor: cssColor(unit.color) }} />} label="Color" value={unit.color ?? "—"} />
          <Mini icon={<Gauge className="h-3 w-3" />} label="Mileage" value={`${Math.round(Number(unit.mileage) / 1000)}k km`} />
          <Mini icon={<ShieldCheck className="h-3 w-3" />} label="Insurance" value={unit.insurance_expiry ?? "—"} />
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <Link to="/admin/fleet/vehicles/$unitId" params={{ unitId: unit.id }} className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan hover:gap-2.5 transition-all">
            Open profile <ExternalLink className="h-3 w-3" />
          </Link>
          <div className="flex gap-1">
            <button onClick={onEdit} className="rounded p-1.5 text-cyan hover:bg-cyan/10" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
            <button onClick={onDelete} className="rounded p-1.5 text-rose-600 hover:bg-rose-100" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/admin/fleet/vehicles/")({ component: VehiclesAdmin });

function VehiclesAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [editing, setEditing] = useState<Partial<Unit> | null>(null);

  const { data: units = [], isLoading } = useQuery({
    queryKey: ["fleet_units"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("fleet_units").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Unit[];
    },
  });

  const { data: types = [] } = useQuery({
    queryKey: ["vehicle_types_min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("id,name,image_url,category").order("name");
      if (error) throw error;
      return data as VehicleType[];
    },
  });
  const typeMap = Object.fromEntries(types.map((t) => [t.id, t]));

  const save = useMutation({
    mutationFn: async (u: Partial<Unit>) => {
      if (!u.vehicle_id) throw new Error("Vehicle type is required");
      if (!u.plate_number?.trim()) throw new Error("Plate number is required");
      const payload: any = {
        vehicle_id: u.vehicle_id,
        plate_number: u.plate_number.trim().toUpperCase(),
        vin: u.vin?.trim() || null,
        color: u.color || null,
        mileage: Number(u.mileage ?? 0),
        status: u.status ?? "available",
        purchase_date: u.purchase_date || null,
        purchase_price: u.purchase_price != null && (u.purchase_price as any) !== "" ? Number(u.purchase_price) : null,
        insurance_expiry: u.insurance_expiry || null,
        registration_expiry: u.registration_expiry || null,
        photo_url: u.photo_url || null,
        notes: u.notes || null,
      };
      if (u.id) {
        const { error } = await (supabase as any).from("fleet_units").update(payload).eq("id", u.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("fleet_units").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fleet_units"] }); qc.invalidateQueries({ queryKey: ["fleet_unit_counts"] }); setEditing(null); toast.success("Vehicle saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("fleet_units").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fleet_units"] }); qc.invalidateQueries({ queryKey: ["fleet_unit_counts"] }); },
    onError: (e: any) => notifyError(e.message),
  });

  async function handleDelete(u: Unit) {
    const ok = await confirmDelete({
      itemLabel: u.plate_number,
      description: "All maintenance history for this vehicle will be deleted too.",
      typeToConfirm: true,
    });
    if (!ok) return;
    await del.mutateAsync(u.id);
    await notifyDeleted(u.plate_number);
  }

  const filtered = units.filter((u) => {
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (!q) return true;
    const t = typeMap[u.vehicle_id];
    const hay = `${u.plate_number} ${u.vin ?? ""} ${u.color ?? ""} ${t?.name ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const counts = useMemo(() => {
    const c = { all: units.length, available: 0, rented: 0, maintenance: 0, retired: 0 } as Record<string, number>;
    units.forEach((u) => { c[u.status] = (c[u.status] ?? 0) + 1; });
    return c;
  }, [units]);

  return (
    <div>
      <PageHeader
        title="Vehicles"
        subtitle="Physical cars with unique plate numbers. Availability on the website is calculated from these."
        actions={
          <PrimaryButton onClick={() => setEditing({ status: "available", mileage: 0, vehicle_id: types[0]?.id })}>
            <Plus className="h-4 w-4" /> Register vehicle
          </PrimaryButton>
        }
      />
      {/* KPI strip */}
      <div className="mb-5 grid gap-3 grid-cols-2 md:grid-cols-4">
        <KPI label="Total fleet" value={counts.all} accent="navy" />
        <KPI label="Available" value={counts.available ?? 0} accent="emerald" />
        <KPI label="Rented" value={counts.rented ?? 0} accent="cyan" />
        <KPI label="In maintenance" value={counts.maintenance ?? 0} accent="amber" />
      </div>

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 flex-1 max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by plate, VIN, type…" className="w-full bg-transparent text-sm outline-none" />
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1 text-xs">
          {(["all","available","rented","maintenance","retired"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded font-semibold transition ${statusFilter === s ? "bg-navy text-white" : "text-muted-foreground hover:text-navy"}`}>
              {s[0].toUpperCase() + s.slice(1)} <span className="opacity-60">({counts[s] ?? 0})</span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-md border border-border bg-card p-1">
          <button onClick={() => setView("grid")} className={`p-1.5 rounded ${view === "grid" ? "bg-navy text-white" : "text-muted-foreground hover:text-navy"}`} title="Grid view"><LayoutGrid className="h-4 w-4" /></button>
          <button onClick={() => setView("table")} className={`p-1.5 rounded ${view === "table" ? "bg-navy text-white" : "text-muted-foreground hover:text-navy"}`} title="Table view"><ListIcon className="h-4 w-4" /></button>
        </div>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : filtered.length === 0 ? (
        <EmptyState icon={Car} title="No vehicles registered" body="Register your first physical car." />
      ) : view === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((u) => <VehicleCard key={u.id} unit={u} type={typeMap[u.vehicle_id]} onEdit={() => setEditing(u)} onDelete={() => handleDelete(u)} />)}
        </div>
      ) : (
        <TableShell>
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
            <tr>
              <th className="px-4 py-3">Plate</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Color</th>
              <th className="px-4 py-3">Mileage</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const t = typeMap[u.vehicle_id];
              return (
                <tr key={u.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.photo_url || t?.image_url ? (
                        <img src={u.photo_url ?? t?.image_url ?? ""} alt="" className="h-10 w-14 rounded-md object-cover ring-1 ring-border" />
                      ) : (
                        <div className="flex h-10 w-14 items-center justify-center rounded-md bg-muted"><Car className="h-4 w-4 text-muted-foreground" /></div>
                      )}
                      <Link to="/admin/fleet/vehicles/$unitId" params={{ unitId: u.id }} className="font-mono font-bold text-navy hover:text-cyan">
                        {u.plate_number}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{t?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{u.color ?? "—"}</td>
                  <td className="px-4 py-3 text-sm">{Number(u.mileage).toLocaleString()} km</td>
                  <td className="px-4 py-3"><Pill tone={statusTone(u.status)}>{u.status}</Pill></td>
                  <td className="px-4 py-3 text-right">
                    <Link to="/admin/fleet/vehicles/$unitId" params={{ unitId: u.id }} className="mr-1 inline-flex rounded p-1.5 hover:bg-cyan/10" title="Open profile"><ExternalLink className="h-4 w-4 text-cyan" /></Link>
                    <button onClick={() => setEditing(u)} className="mr-1 rounded p-1.5 hover:bg-cyan/10" title="Edit"><Pencil className="h-4 w-4 text-cyan" /></button>
                    <button onClick={() => handleDelete(u)} className="rounded p-1.5 hover:bg-rose-100" title="Delete"><Trash2 className="h-4 w-4 text-rose-600" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}

      <FormDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Edit ${editing.plate_number}` : "Register new vehicle"}
        subtitle="Physical car details, plate, insurance and registration."
        size="lg"
        footer={
          <>
            <GhostButton onClick={() => setEditing(null)}>Cancel</GhostButton>
            <PrimaryButton form="unit-form" type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : editing?.id ? "Save changes" : "Register vehicle"}</PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="unit-form" onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }} className="grid gap-5 md:grid-cols-[1fr_1.5fr]">
            <div>
              <ImageUploader value={editing.photo_url} onChange={(url) => setEditing({ ...editing, photo_url: url })} folder="fleet-units" label="Vehicle photo" aspect="video" />
            </div>
            <div className="space-y-4">
              <FieldGroup label="Vehicle type" required hint="Pricing, fuel, transmission come from the type.">
                <FDSelect required value={editing.vehicle_id ?? ""} onChange={(e) => setEditing({ ...editing, vehicle_id: e.target.value })}>
                  <option value="" disabled>Select a vehicle type…</option>
                  {types.map((t) => <option key={t.id} value={t.id}>{t.name}{t.category ? ` · ${t.category}` : ""}</option>)}
                </FDSelect>
              </FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Plate number" required>
                  <Input required value={editing.plate_number ?? ""} onChange={(e) => setEditing({ ...editing, plate_number: e.target.value.toUpperCase() })} placeholder="SL-A12345" className="font-mono uppercase" />
                </FieldGroup>
                <FieldGroup label="VIN" hint="Optional but recommended">
                  <Input value={editing.vin ?? ""} onChange={(e) => setEditing({ ...editing, vin: e.target.value })} placeholder="17-character VIN" />
                </FieldGroup>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FieldGroup label="Color"><Input value={editing.color ?? ""} onChange={(e) => setEditing({ ...editing, color: e.target.value })} placeholder="White" /></FieldGroup>
                <FieldGroup label="Mileage (km)"><Input type="number" min={0} value={editing.mileage ?? 0} onChange={(e) => setEditing({ ...editing, mileage: Number(e.target.value) })} /></FieldGroup>
                <FieldGroup label="Status">
                  <FDSelect value={editing.status ?? "available"} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                    <option value="available">Available</option>
                    <option value="rented">Rented</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </FDSelect>
                </FieldGroup>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Purchase date"><Input type="date" value={editing.purchase_date ?? ""} onChange={(e) => setEditing({ ...editing, purchase_date: e.target.value })} /></FieldGroup>
                <FieldGroup label="Purchase price (USD)"><Input type="number" min={0} value={(editing.purchase_price as any) ?? ""} onChange={(e) => setEditing({ ...editing, purchase_price: e.target.value as any })} /></FieldGroup>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Insurance expiry"><Input type="date" value={editing.insurance_expiry ?? ""} onChange={(e) => setEditing({ ...editing, insurance_expiry: e.target.value })} /></FieldGroup>
                <FieldGroup label="Registration expiry"><Input type="date" value={editing.registration_expiry ?? ""} onChange={(e) => setEditing({ ...editing, registration_expiry: e.target.value })} /></FieldGroup>
              </div>
              <FieldGroup label="Notes"><Textarea value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} placeholder="Any condition notes, accessories, special equipment…" /></FieldGroup>
            </div>
          </form>
        )}
      </FormDialog>
    </div>
  );
}