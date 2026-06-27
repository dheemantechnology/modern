import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Tag, Crown, Compass, Car, ArrowRight, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/admin/ui";
import { FormDialog, FieldGroup, Input, Textarea, PrimaryButton, GhostButton } from "@/components/admin/FormDialog";
import { confirmDelete, notifyDeleted, notifyError } from "@/lib/swal";

type Category = {
  id: string; name: string; slug: string; description: string | null; sort_order: number;
};

export const Route = createFileRoute("/admin/fleet/categories")({ component: CategoriesAdmin });

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function CategoriesAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Category> | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["vehicle_categories"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("vehicle_categories").select("*").order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: stats = {} } = useQuery({
    queryKey: ["vehicle_counts_by_cat"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("vehicles")
        .select("id,category_id,daily_rate");
      if (error) throw error;
      const { data: units, error: e2 } = await (supabase as any).from("fleet_units").select("vehicle_id,status");
      if (e2) throw e2;
      const typeToCat: Record<string, string | null> = {};
      const map: Record<string, { types: number; units: number; available: number; minPrice: number | null; maxPrice: number | null }> = {};
      for (const v of data as any[]) {
        typeToCat[v.id] = v.category_id;
        if (!v.category_id) continue;
        const m = map[v.category_id] ?? (map[v.category_id] = { types: 0, units: 0, available: 0, minPrice: null, maxPrice: null });
        m.types++;
        const p = Number(v.daily_rate);
        m.minPrice = m.minPrice == null ? p : Math.min(m.minPrice, p);
        m.maxPrice = m.maxPrice == null ? p : Math.max(m.maxPrice, p);
      }
      for (const u of units as any[]) {
        const cat = typeToCat[u.vehicle_id];
        if (!cat || !map[cat]) continue;
        map[cat].units++;
        if (u.status === "available") map[cat].available++;
      }
      return map;
    },
  });

  const save = useMutation({
    mutationFn: async (c: Partial<Category>) => {
      const payload: any = {
        name: c.name?.trim(),
        slug: (c.slug?.trim() || slugify(c.name ?? "")),
        description: c.description ?? null,
        sort_order: Number(c.sort_order ?? 0),
      };
      if (!payload.name) throw new Error("Name is required");
      if (c.id) {
        const { error } = await (supabase as any).from("vehicle_categories").update(payload).eq("id", c.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("vehicle_categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicle_categories"] }); setEditing(null); toast.success("Category saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("vehicle_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicle_categories"] }),
    onError: (e: any) => notifyError(e.message),
  });

  async function handleDelete(c: Category) {
    const inUse = stats[c.id]?.types ?? 0;
    const ok = await confirmDelete({
      itemLabel: c.name,
      description: inUse > 0
        ? `Warning: ${inUse} vehicle type(s) are currently assigned to this category. They will be unlinked.`
        : "This category will be removed permanently.",
    });
    if (!ok) return;
    await del.mutateAsync(c.id);
    await notifyDeleted(c.name);
  }

  return (
    <div>
      <PageHeader
        title="Vehicle Categories"
        subtitle="Top-level groupings such as Luxury, Mini SUV, Sedan. Vehicle Types belong to a category."
        actions={
          <PrimaryButton onClick={() => setEditing({ sort_order: (items[items.length - 1]?.sort_order ?? 0) + 1 })}>
            <Plus className="h-4 w-4" /> New category
          </PrimaryButton>
        }
      />
      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : items.length === 0 ? (
        <EmptyState icon={Tag} title="No categories yet" body="Create your first vehicle category." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((c) => <CategoryCard key={c.id} cat={c} s={stats[c.id]} onEdit={() => setEditing(c)} onDelete={() => handleDelete(c)} />)}
          <button
            onClick={() => setEditing({ sort_order: (items[items.length - 1]?.sort_order ?? 0) + 1 })}
            className="group flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card/40 p-6 text-muted-foreground transition hover:border-cyan hover:bg-cyan/5 hover:text-cyan"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted group-hover:bg-cyan/10"><Plus className="h-5 w-5" /></div>
            <p className="text-sm font-semibold">Add new category</p>
          </button>
        </div>
      )}

      <FormDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit category" : "New vehicle category"}
        footer={
          <>
            <GhostButton onClick={() => setEditing(null)}>Cancel</GhostButton>
            <PrimaryButton form="cat-form" type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="cat-form" onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }} className="space-y-4">
            <FieldGroup label="Name" required>
              <Input required value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} placeholder="Luxury" />
            </FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Slug" hint="URL-friendly identifier">
                <Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="luxury" />
              </FieldGroup>
              <FieldGroup label="Sort order">
                <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
              </FieldGroup>
            </div>
            <FieldGroup label="Description">
              <Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Premium executive vehicles…" />
            </FieldGroup>
          </form>
        )}
      </FormDialog>
    </div>
  );
}

function iconFor(slug: string) {
  if (slug.includes("lux")) return Crown;
  if (slug.includes("suv")) return Compass;
  return Car;
}

function gradientFor(slug: string) {
  if (slug.includes("lux")) return "from-amber-500 via-orange-500 to-rose-500";
  if (slug.includes("suv")) return "from-emerald-500 via-teal-500 to-cyan-500";
  if (slug.includes("sedan")) return "from-blue-500 via-indigo-500 to-purple-500";
  return "from-slate-500 via-slate-600 to-slate-700";
}

type Stat = { types: number; units: number; available: number; minPrice: number | null; maxPrice: number | null };

function CategoryCard({ cat, s, onEdit, onDelete }: { cat: Category; s?: Stat; onEdit: () => void; onDelete: () => void }) {
  const Icon = iconFor(cat.slug);
  const grad = gradientFor(cat.slug);
  const types = s?.types ?? 0;
  const units = s?.units ?? 0;
  const available = s?.available ?? 0;
  const utilisation = units > 0 ? Math.round(((units - available) / units) * 100) : 0;
  const priceLabel = s?.minPrice != null && s?.maxPrice != null
    ? s.minPrice === s.maxPrice ? `$${s.minPrice}` : `$${s.minPrice} – $${s.maxPrice}`
    : "—";

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-xl">
      {/* gradient hero */}
      <div className={`relative h-32 bg-gradient-to-br ${grad}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
        <div className="absolute right-4 top-4 flex gap-1">
          <button onClick={onEdit} className="rounded-full bg-white/20 p-1.5 text-white backdrop-blur hover:bg-white/30" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={onDelete} className="rounded-full bg-white/20 p-1.5 text-white backdrop-blur hover:bg-rose-500" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
        <div className="absolute -bottom-6 left-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg ring-4 ring-card">
          <Icon className="h-7 w-7 text-navy" />
        </div>
      </div>

      <div className="px-5 pt-9 pb-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-bold text-navy">{cat.name}</h3>
            <p className="mt-0.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{cat.slug}</p>
          </div>
          <span className="rounded-full bg-cyan/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan">#{cat.sort_order}</span>
        </div>
        <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">{cat.description ?? "No description provided."}</p>

        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-3 text-center">
          <div>
            <p className="font-display text-lg font-bold text-navy">{types}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Types</p>
          </div>
          <div className="border-x border-border">
            <p className="font-display text-lg font-bold text-navy">{units}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Vehicles</p>
          </div>
          <div>
            <p className="font-display text-lg font-bold text-emerald-600">{available}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Available</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Utilisation</span>
            <span className="font-bold text-navy">{utilisation}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className={`h-full bg-gradient-to-r ${grad} transition-all`} style={{ width: `${utilisation}%` }} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Daily price</p>
            <p className="text-sm font-bold text-navy">{priceLabel}</p>
          </div>
          <Link to="/admin/fleet" className="inline-flex items-center gap-1 text-xs font-semibold text-cyan hover:gap-2 transition-all">
            View types <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}