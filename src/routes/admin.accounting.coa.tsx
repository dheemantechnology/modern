import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Pill, TableShell, EmptyState } from "@/components/admin/ui";
import { FormDialog, FieldGroup, Input, Select, Textarea, PrimaryButton, GhostButton } from "@/components/admin/FormDialog";

export const Route = createFileRoute("/admin/accounting/coa")({ component: CoAPage });

const TYPES = ["asset", "liability", "equity", "income", "expense"] as const;

function CoAPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*").order("code");
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (vals: any) => {
      if (editing?.id) {
        const { error } = await supabase.from("accounts").update(vals).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("accounts").insert(vals);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account saved");
      setOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const grouped = (accounts as any[]).reduce<Record<string, any[]>>((acc, a) => {
    (acc[a.type] = acc[a.type] || []).push(a);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Chart of Accounts"
        subtitle="All ledger accounts powering your books"
        actions={
          <PrimaryButton onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4" /> New account
          </PrimaryButton>
        }
      />

      {accounts.length === 0 ? (
        <EmptyState icon={BookOpen} title="No accounts yet" body="Create your first ledger account." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {TYPES.map((t) => (
            <div key={t} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-lg font-bold capitalize text-navy">{t}s</h3>
                <Pill tone="cyan">{(grouped[t] ?? []).length}</Pill>
              </div>
              <TableShell>
                <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
                  <tr><th className="px-3 py-2">Code</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Edit</th></tr>
                </thead>
                <tbody>
                  {(grouped[t] ?? []).map((a) => (
                    <tr key={a.id} className="border-t border-border">
                      <td className="px-3 py-2 font-mono text-xs">{a.code}</td>
                      <td className="px-3 py-2">{a.name}</td>
                      <td className="px-3 py-2"><Pill tone={a.is_active ? "green" : "muted"}>{a.is_active ? "active" : "inactive"}</Pill></td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => { setEditing(a); setOpen(true); }} className="rounded-md border border-border p-1.5 hover:border-cyan"><Pencil className="h-3.5 w-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            </div>
          ))}
        </div>
      )}

      {open && (
        <AccountDialog
          initial={editing}
          onClose={() => { setOpen(false); setEditing(null); }}
          onSave={(v) => save.mutate(v)}
          saving={save.isPending}
        />
      )}
    </div>
  );
}

function AccountDialog({ initial, onClose, onSave, saving }: { initial: any; onClose: () => void; onSave: (v: any) => void; saving: boolean }) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState(initial?.type ?? "asset");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  return (
    <FormDialog
      open
      onClose={onClose}
      title={initial ? "Edit account" : "New account"}
      footer={
        <>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton disabled={saving || !code || !name} onClick={() => onSave({ code, name, type, description, is_active: isActive })}>
            {saving ? "Saving…" : "Save"}
          </PrimaryButton>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Code" required>
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="1010" />
        </FieldGroup>
        <FieldGroup label="Type" required>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </FieldGroup>
        <FieldGroup label="Name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cash on Hand" />
        </FieldGroup>
        <FieldGroup label="Status">
          <Select value={isActive ? "1" : "0"} onChange={(e) => setIsActive(e.target.value === "1")}>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </Select>
        </FieldGroup>
        <div className="sm:col-span-2">
          <FieldGroup label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </FieldGroup>
        </div>
      </div>
    </FormDialog>
  );
}