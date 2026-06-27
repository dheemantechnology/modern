import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Car, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Pill, statusTone, TableShell, EmptyState } from "@/components/admin/ui";
import { FormDialog, FieldGroup, Input, Select as FDSelect, Textarea, PrimaryButton, GhostButton } from "@/components/admin/FormDialog";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { confirmDelete, notifyDeleted, notifyError } from "@/lib/swal";
import { normalizeTiers, type RateTier } from "@/lib/rateTiers";

type Vehicle = {
  id: string; name: string; make: string | null; model: string | null; year: number | null;
  category: string | null; category_id: string | null; daily_rate: number; status: string; image_url: string | null;
  seats: number | null; transmission: string | null; fuel: string | null; description: string | null;
  rate_tiers?: any;
};

type Category = { id: string; name: string; slug: string };

export const Route = createFileRoute("/admin/fleet/")({ component: FleetAdmin });

function FleetAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Partial<Vehicle> | null>(null);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Vehicle[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["vehicle_categories"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("vehicle_categories").select("id,name,slug").order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: unitCounts = {} } = useQuery({
    queryKey: ["fleet_unit_counts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("fleet_units").select("vehicle_id,status");
      if (error) throw error;
      const map: Record<string, { total: number; available: number }> = {};
      for (const r of data as any[]) {
        const k = r.vehicle_id;
        if (!map[k]) map[k] = { total: 0, available: 0 };
        map[k].total++;
        if (r.status === "available") map[k].available++;
      }
      return map;
    },
  });

  const save = useMutation({
    mutationFn: async (v: Partial<Vehicle>) => {
      const payload: any = {
        ...v,
        daily_rate: Number(v.daily_rate ?? 0),
        year: v.year ? Number(v.year) : null,
        seats: v.seats ? Number(v.seats) : null,
        rate_tiers: normalizeTiers(v.rate_tiers ?? []),
      };
      delete payload.id; delete payload.created_at; delete payload.updated_at;
      // sync legacy `category` text from selected category_id
      if (payload.category_id) {
        const cat = categories.find((c) => c.id === payload.category_id);
        if (cat) payload.category = cat.name;
      }
      if (v.id) {
        const { error } = await supabase.from("vehicles").update(payload).eq("id", v.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("vehicles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicles"] }); setEditing(null); toast.success("Vehicle saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, _v) => { qc.invalidateQueries({ queryKey: ["vehicles"] }); },
    onError: (e: any) => notifyError(e.message),
  });

  async function handleDelete(v: Vehicle) {
    const ok = await confirmDelete({
      itemLabel: `${v.name} (${v.year ?? "—"})`,
      description: "This vehicle will be removed from the fleet and from the public website.",
      typeToConfirm: true,
    });
    if (!ok) return;
    await del.mutateAsync(v.id);
    await notifyDeleted(v.name);
  }

  const filtered = vehicles.filter((v) => !q || (v.name + " " + (v.make ?? "") + " " + (v.model ?? "")).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Vehicle Types"
        subtitle="Each type belongs to a category and defines the daily price. Physical cars are managed under Vehicles."
        actions={
          <PrimaryButton onClick={() => setEditing({ status: "available", daily_rate: 50, seats: 5, transmission: "Automatic", fuel: "Petrol", category_id: categories[0]?.id })}>
            <Plus className="h-4 w-4" /> New vehicle type
          </PrimaryButton>
        }
      />

      <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search vehicles…" className="w-full bg-transparent text-sm outline-none" />
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : filtered.length === 0 ? (
        <EmptyState icon={Car} title="No vehicles yet" body="Add your first vehicle to start renting."
          action={<PrimaryButton onClick={() => setEditing({ status: "available", daily_rate: 50, seats: 5 })}><Plus className="h-4 w-4" /> Add vehicle</PrimaryButton>} />
      ) : (
        <TableShell>
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
            <tr><th className="px-4 py-3">Vehicle type</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Daily</th><th className="px-4 py-3">In fleet</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id} className="border-t border-border hover:bg-muted/20 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {v.image_url ? (
                      <img src={v.image_url} alt="" className="h-12 w-16 rounded-lg object-cover ring-1 ring-border" />
                    ) : (
                      <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Car className="h-5 w-5" /></div>
                    )}
                    <div>
                      <p className="font-semibold text-navy">{v.name}</p>
                      <p className="text-xs text-muted-foreground">{v.make} {v.model}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{v.category ?? "—"}</td>
                <td className="px-4 py-3 font-semibold">${Number(v.daily_rate).toFixed(0)}</td>
                <td className="px-4 py-3 text-xs">
                  <span className="font-semibold text-navy">{unitCounts[v.id]?.available ?? 0}</span>
                  <span className="text-muted-foreground"> / {unitCounts[v.id]?.total ?? 0}</span>
                </td>
                <td className="px-4 py-3"><Pill tone={statusTone(v.status)}>{v.status}</Pill></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(v)} className="mr-1 rounded p-1.5 hover:bg-cyan/10" title="Edit"><Pencil className="h-4 w-4 text-cyan" /></button>
                  <button onClick={() => handleDelete(v)} className="rounded p-1.5 hover:bg-rose-100" title="Delete"><Trash2 className="h-4 w-4 text-rose-600" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <FormDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit vehicle" : "Add new vehicle"}
        subtitle={editing?.id ? `Updating ${editing.name ?? ""}` : "Fill in the details below"}
        size="lg"
        footer={
          <>
            <GhostButton onClick={() => setEditing(null)}>Cancel</GhostButton>
            <PrimaryButton form="vehicle-form" type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : editing?.id ? "Save changes" : "Create vehicle"}
            </PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="vehicle-form" onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }} className="grid gap-5 md:grid-cols-[1fr_1.5fr]">
            <div>
              <ImageUploader
                value={editing.image_url}
                onChange={(url) => setEditing({ ...editing, image_url: url })}
                folder="vehicles"
                label="Vehicle photo"
                aspect="video"
              />
            </div>
            <div className="space-y-4">
              <FieldGroup label="Display name" required>
                <Input required value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Toyota Land Cruiser V8" />
              </FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Make"><Input value={editing.make ?? ""} onChange={(e) => setEditing({ ...editing, make: e.target.value })} /></FieldGroup>
                <FieldGroup label="Model"><Input value={editing.model ?? ""} onChange={(e) => setEditing({ ...editing, model: e.target.value })} /></FieldGroup>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Daily rate (USD)" required><Input type="number" min={0} value={editing.daily_rate ?? ""} onChange={(e) => setEditing({ ...editing, daily_rate: e.target.value as any })} /></FieldGroup>
                <FieldGroup label="Category" required>
                  <FDSelect required value={editing.category_id ?? ""} onChange={(e) => setEditing({ ...editing, category_id: e.target.value })}>
                    <option value="" disabled>Select a category…</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </FDSelect>
                </FieldGroup>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FieldGroup label="Seats"><Input type="number" value={editing.seats ?? 5} onChange={(e) => setEditing({ ...editing, seats: e.target.value as any })} /></FieldGroup>
                <FieldGroup label="Transmission">
                  <FDSelect value={editing.transmission ?? "Automatic"} onChange={(e) => setEditing({ ...editing, transmission: e.target.value })}>
                    <option>Automatic</option><option>Manual</option>
                  </FDSelect>
                </FieldGroup>
                <FieldGroup label="Fuel">
                  <FDSelect value={editing.fuel ?? "Petrol"} onChange={(e) => setEditing({ ...editing, fuel: e.target.value })}>
                    <option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>Electric</option>
                  </FDSelect>
                </FieldGroup>
              </div>
              <FieldGroup label="Status">
                <FDSelect value={editing.status ?? "available"} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  <option value="available">Available</option>
                  <option value="rented">Rented</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                </FDSelect>
              </FieldGroup>
              <FieldGroup label="Description">
                <Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Brief overview shown on the public website…" />
              </FieldGroup>
              <TierEditor
                tiers={normalizeTiers(editing.rate_tiers ?? [])}
                baseRate={Number(editing.daily_rate ?? 0)}
                onChange={(next) => setEditing({ ...editing, rate_tiers: next })}
              />
            </div>
          </form>
        )}
      </FormDialog>
    </div>
  );
}

function TierEditor({ tiers, baseRate, onChange }: { tiers: RateTier[]; baseRate: number; onChange: (t: RateTier[]) => void }) {
  const update = (i: number, patch: Partial<RateTier>) => {
    const next = tiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t));
    onChange(next);
  };
  const add = () => {
    const last = tiers[tiers.length - 1];
    const min = last ? (last.max_days ?? last.min_days) + 1 : 1;
    onChange([...tiers, { min_days: min, max_days: min + 4, daily_rate: baseRate }]);
  };
  const remove = (i: number) => onChange(tiers.filter((_, idx) => idx !== i));
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-navy">Rate tiers (price by duration)</p>
          <p className="text-[11px] text-muted-foreground">Optional. Auto-applied on bookings based on number of days. If empty, the base daily rate above is used.</p>
        </div>
        <button type="button" onClick={add} className="rounded-md bg-cyan px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-cyan/90">
          <Plus className="inline h-3 w-3" /> Add tier
        </button>
      </div>
      {tiers.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No tiers yet — using flat ${Number(baseRate || 0).toFixed(0)}/day.</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>From day</span><span>To day (blank = ∞)</span><span>$ / day</span><span></span>
          </div>
          {tiers.map((t, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
              <Input type="number" min={1} value={t.min_days} onChange={(e) => update(i, { min_days: Number(e.target.value) })} />
              <Input type="number" min={1} value={t.max_days ?? ""} placeholder="∞" onChange={(e) => update(i, { max_days: e.target.value === "" ? null : Number(e.target.value) })} />
              <Input type="number" min={0} step="0.01" value={t.daily_rate} onChange={(e) => update(i, { daily_rate: Number(e.target.value) })} />
              <button type="button" onClick={() => remove(i)} className="rounded p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Re-export legacy primitives so files importing from this module keep working.
// The new code path uses @/components/admin/FormDialog instead.
export function Drawer({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <FormDialog open={true} onClose={onClose} title={title} size="md">
      {children}
    </FormDialog>
  );
}
export function Field({ label, value, onChange, type = "text", placeholder, required }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <FieldGroup label={label} required={required}>
      <Input type={type} required={required} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </FieldGroup>
  );
}
// Legacy Select with (label, value, onChange, options) signature for back-compat
export function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <FieldGroup label={label}>
      <FDSelect value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </FDSelect>
    </FieldGroup>
  );
}
export function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <FieldGroup label={label}>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} />
    </FieldGroup>
  );
}
