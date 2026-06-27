import { ReactNode, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableShell, EmptyState, Pill } from "@/components/admin/ui";
import { FormDialog, FieldGroup, Input, Select, Textarea, PrimaryButton, GhostButton } from "@/components/admin/FormDialog";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "textarea";
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  default?: any;
};

export function HrCrudPage({
  title,
  subtitle,
  table,
  selectQuery,
  columns,
  fields,
  icon: Icon,
  emptyBody,
  rowKey,
}: {
  title: string;
  subtitle: string;
  table: string;
  selectQuery: string;
  columns: Array<{ header: string; render: (row: any) => ReactNode }>;
  fields: Field[];
  icon: any;
  emptyBody: string;
  rowKey?: (row: any) => string;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const { data: rows = [] } = useQuery({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table as any).select(selectQuery).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (vals: any) => {
      if (editing?.id) {
        const { error } = await supabase.from(table as any).update(vals).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table as any).insert(vals);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [table] }); toast.success("Saved"); setOpen(false); setEditing(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [table] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} actions={
        <PrimaryButton onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> New</PrimaryButton>
      } />

      {(rows as any[]).length === 0 ? (
        <EmptyState icon={Icon} title="Nothing yet" body={emptyBody} />
      ) : (
        <TableShell>
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
            <tr>
              {columns.map((c) => <th key={c.header} className="px-4 py-3">{c.header}</th>)}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(rows as any[]).map((r) => (
              <tr key={rowKey ? rowKey(r) : r.id} className="border-t border-border hover:bg-muted/20">
                {columns.map((c, i) => <td key={i} className="px-4 py-3">{c.render(r)}</td>)}
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setEditing(r); setOpen(true); }} className="mr-2 rounded-md border border-border p-1.5 hover:border-cyan"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => { if (confirm("Delete this record?")) del.mutate(r.id); }} className="rounded-md border border-border p-1.5 text-rose-500 hover:border-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      {open && (
        <CrudDialog
          title={editing ? `Edit ${title.slice(0, -1)}` : `New ${title.slice(0, -1)}`}
          fields={fields}
          initial={editing}
          onClose={() => { setOpen(false); setEditing(null); }}
          onSave={(v) => save.mutate(v)}
          saving={save.isPending}
        />
      )}
    </div>
  );
}

function CrudDialog({ title, fields, initial, onClose, onSave, saving }: { title: string; fields: Field[]; initial: any; onClose: () => void; onSave: (v: any) => void; saving: boolean }) {
  const [vals, setVals] = useState<Record<string, any>>(() => {
    const v: Record<string, any> = {};
    for (const f of fields) v[f.name] = initial?.[f.name] ?? f.default ?? (f.type === "number" ? 0 : "");
    return v;
  });

  const set = (k: string, v: any) => setVals((s) => ({ ...s, [k]: v }));

  return (
    <FormDialog
      open
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton disabled={saving} onClick={() => {
            const cleaned: any = {};
            for (const f of fields) {
              const v = vals[f.name];
              if (v === "" || v === undefined) { cleaned[f.name] = null; continue; }
              cleaned[f.name] = f.type === "number" ? Number(v) : v;
            }
            onSave(cleaned);
          }}>{saving ? "Saving…" : "Save"}</PrimaryButton>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
            <FieldGroup label={f.label} required={f.required}>
              {f.type === "select" ? (
                <Select value={vals[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)}>
                  <option value="">Select…</option>
                  {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              ) : f.type === "textarea" ? (
                <Textarea value={vals[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} />
              ) : (
                <Input type={f.type ?? "text"} value={vals[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} />
              )}
            </FieldGroup>
          </div>
        ))}
      </div>
    </FormDialog>
  );
}

export { Pill };