import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Wrench, Search, ExternalLink, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableShell, EmptyState } from "@/components/admin/ui";
import { FormDialog, FieldGroup, Input, Select as FDSelect, Textarea, PrimaryButton, GhostButton } from "@/components/admin/FormDialog";
import { confirmDelete, notifyDeleted, notifyError } from "@/lib/swal";

type Maint = {
  id: string; fleet_unit_id: string; kind: string; title: string; description: string | null;
  cost: number; odometer: number | null; vendor: string | null;
  performed_at: string; next_due_at: string | null; status: string;
};
type Unit = { id: string; plate_number: string; vehicle_id: string };
type VType = { id: string; name: string };

export const Route = createFileRoute("/admin/fleet/maintenance")({ component: MaintenanceAdmin });

function MaintenanceAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Partial<Maint> | null>(null);

  const { data: records = [], isLoading } = useQuery<Maint[]>({
    queryKey: ["maintenance"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("maintenance_records").select("*").order("performed_at", { ascending: false });
      if (error) throw error;
      return data as Maint[];
    },
  });

  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ["fleet_units_min"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("fleet_units").select("id,plate_number,vehicle_id").order("plate_number");
      if (error) throw error;
      return data as Unit[];
    },
  });
  const unitMap = Object.fromEntries(units.map((u) => [u.id, u]));

  const { data: types = [] } = useQuery<VType[]>({
    queryKey: ["vehicle_types_min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("id,name");
      if (error) throw error;
      return data as VType[];
    },
  });
  const typeMap = Object.fromEntries(types.map((t) => [t.id, t.name]));

  const save = useMutation({
    mutationFn: async (m: Partial<Maint>) => {
      if (!m.fleet_unit_id) throw new Error("Vehicle is required");
      if (!m.title?.trim()) throw new Error("Title is required");
      const payload: any = {
        fleet_unit_id: m.fleet_unit_id,
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["maintenance"] }); setEditing(null); toast.success("Record saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("maintenance_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance"] }),
    onError: (e: any) => notifyError(e.message),
  });

  async function handleDelete(m: Maint) {
    const ok = await confirmDelete({ itemLabel: m.title, description: "This record will be permanently removed." });
    if (!ok) return;
    await del.mutateAsync(m.id);
    await notifyDeleted(m.title);
  }

  const filtered = useMemo(() => records.filter((m) => {
    if (!q) return true;
    const u = unitMap[m.fleet_unit_id];
    const hay = `${m.title} ${m.vendor ?? ""} ${m.kind} ${u?.plate_number ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  }), [records, q, unitMap]);

  const totalSpend = filtered.reduce((s, m) => s + Number(m.cost || 0), 0);
  const upcoming = records.filter((m) => m.next_due_at && new Date(m.next_due_at) > new Date() && new Date(m.next_due_at) < new Date(Date.now() + 30 * 86400000));

  return (
    <div>
      <PageHeader
        title="Maintenance"
        subtitle="Service history, repairs and upcoming reminders across the fleet."
        actions={
          <PrimaryButton onClick={() => setEditing({ kind: "service", performed_at: new Date().toISOString().slice(0, 10), fleet_unit_id: units[0]?.id })}>
            <Plus className="h-4 w-4" /> Add record
          </PrimaryButton>
        }
      />

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <KPI label="Total records" value={records.length.toString()} />
        <KPI label="Total spend" value={`$${totalSpend.toLocaleString()}`} />
        <KPI label="Upcoming (30d)" value={upcoming.length.toString()} accent={upcoming.length > 0} />
      </div>

      {upcoming.length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900">Upcoming service reminders</p>
            <ul className="mt-1 space-y-0.5 text-amber-800">
              {upcoming.slice(0, 5).map((m) => (
                <li key={m.id}>{unitMap[m.fleet_unit_id]?.plate_number ?? "—"} · {m.title} due {m.next_due_at}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by plate, title, vendor…" className="w-full bg-transparent text-sm outline-none" />
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : filtered.length === 0 ? (
        <EmptyState icon={Wrench} title="No maintenance records" body="Log service, repairs and inspections to keep the fleet healthy." />
      ) : (
        <TableShell>
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Kind</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3 text-right">Cost</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const u = unitMap[m.fleet_unit_id];
              return (
                <tr key={m.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{m.performed_at}</td>
                  <td className="px-4 py-3">
                    {u ? (
                      <Link to="/admin/fleet/vehicles/$unitId" params={{ unitId: u.id }} className="inline-flex items-center gap-1 font-mono font-bold text-navy hover:text-cyan">
                        {u.plate_number}<ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : "—"}
                    {u && <p className="text-xs text-muted-foreground">{typeMap[u.vehicle_id] ?? ""}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-navy">{m.title}</p>
                    {m.description && <p className="text-xs text-muted-foreground line-clamp-1">{m.description}</p>}
                  </td>
                  <td className="px-4 py-3"><span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider">{m.kind}</span></td>
                  <td className="px-4 py-3 text-sm">{m.vendor ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-bold">${Number(m.cost).toFixed(0)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setEditing(m)} className="mr-1 rounded p-1.5 hover:bg-cyan/10"><Pencil className="h-4 w-4 text-cyan" /></button>
                    <button onClick={() => handleDelete(m)} className="rounded p-1.5 hover:bg-rose-100"><Trash2 className="h-4 w-4 text-rose-600" /></button>
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
        title={editing?.id ? "Edit maintenance record" : "New maintenance record"}
        footer={
          <>
            <GhostButton onClick={() => setEditing(null)}>Cancel</GhostButton>
            <PrimaryButton form="maint-form-2" type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="maint-form-2" onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }} className="space-y-4">
            <FieldGroup label="Vehicle" required>
              <FDSelect required value={editing.fleet_unit_id ?? ""} onChange={(e) => setEditing({ ...editing, fleet_unit_id: e.target.value })}>
                <option value="" disabled>Select a vehicle…</option>
                {units.map((u) => <option key={u.id} value={u.id}>{u.plate_number} — {typeMap[u.vehicle_id] ?? ""}</option>)}
              </FDSelect>
            </FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Type">
                <FDSelect value={editing.kind ?? "service"} onChange={(e) => setEditing({ ...editing, kind: e.target.value })}>
                  <option value="service">Service</option>
                  <option value="repair">Repair</option>
                  <option value="inspection">Inspection</option>
                  <option value="insurance">Insurance renewal</option>
                  <option value="registration">Registration renewal</option>
                  <option value="other">Other</option>
                </FDSelect>
              </FieldGroup>
              <FieldGroup label="Performed on" required>
                <Input required type="date" value={editing.performed_at ?? ""} onChange={(e) => setEditing({ ...editing, performed_at: e.target.value })} />
              </FieldGroup>
            </div>
            <FieldGroup label="Title" required>
              <Input required value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Engine oil change" />
            </FieldGroup>
            <FieldGroup label="Description"><Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></FieldGroup>
            <div className="grid grid-cols-3 gap-3">
              <FieldGroup label="Cost (USD)"><Input type="number" min={0} value={editing.cost ?? 0} onChange={(e) => setEditing({ ...editing, cost: Number(e.target.value) })} /></FieldGroup>
              <FieldGroup label="Odometer (km)"><Input type="number" min={0} value={(editing.odometer as any) ?? ""} onChange={(e) => setEditing({ ...editing, odometer: e.target.value as any })} /></FieldGroup>
              <FieldGroup label="Vendor"><Input value={editing.vendor ?? ""} onChange={(e) => setEditing({ ...editing, vendor: e.target.value })} /></FieldGroup>
            </div>
            <FieldGroup label="Next due" hint="Optional reminder date"><Input type="date" value={editing.next_due_at ?? ""} onChange={(e) => setEditing({ ...editing, next_due_at: e.target.value })} /></FieldGroup>
          </form>
        )}
      </FormDialog>
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-amber-300 bg-amber-50" : "border-border bg-card"}`}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-navy">{value}</p>
    </div>
  );
}