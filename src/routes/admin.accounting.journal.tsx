import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Calculator, Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Pill, TableShell, EmptyState, StatCard } from "@/components/admin/ui";
import { FormDialog, FieldGroup, Input, Select, Textarea, PrimaryButton, GhostButton } from "@/components/admin/FormDialog";

export const Route = createFileRoute("/admin/accounting/journal")({ component: JournalPage });

function JournalPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const { data: entries = [] } = useQuery({
    queryKey: ["journal-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*, journal_lines(*, accounts(code, name))")
        .order("entry_date", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    if (!filter) return entries;
    const q = filter.toLowerCase();
    return (entries as any[]).filter(
      (e) =>
        e.entry_no?.toLowerCase().includes(q) ||
        e.memo?.toLowerCase().includes(q) ||
        e.source_type?.toLowerCase().includes(q),
    );
  }, [entries, filter]);

  const totalDebit = (entries as any[]).reduce(
    (s, e) => s + e.journal_lines.reduce((x: number, l: any) => x + Number(l.debit), 0),
    0,
  );

  return (
    <div>
      <PageHeader
        title="Journal Entries"
        subtitle="Double-entry ledger — every payment, refund, expense and payroll posts here automatically"
        actions={
          <PrimaryButton onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Manual entry
          </PrimaryButton>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Entries" value={(entries as any[]).length} icon={Calculator} tone="cyan" />
        <StatCard label="Total debits" value={`$${totalDebit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={Calculator} tone="emerald" />
        <StatCard label="Sources" value={new Set((entries as any[]).map((e) => e.source_type)).size} icon={Calculator} tone="amber" />
      </div>

      <div className="mb-4">
        <Input placeholder="Search by entry #, memo or source…" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Calculator} title="No entries" body="No journal entries match the filter." />
      ) : (
        <div className="space-y-3">
          {(filtered as any[]).map((e) => {
            const dr = e.journal_lines.reduce((s: number, l: any) => s + Number(l.debit), 0);
            return (
              <details key={e.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <summary className="flex cursor-pointer items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Pill tone="cyan">{e.entry_no}</Pill>
                    <span className="text-xs text-muted-foreground">{new Date(e.entry_date).toLocaleDateString()}</span>
                    <span className="text-sm">{e.memo}</span>
                    <Pill tone="muted">{e.source_type}</Pill>
                  </div>
                  <span className="font-display text-sm font-bold text-navy">${dr.toFixed(2)}</span>
                </summary>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase text-muted-foreground">
                      <tr><th className="px-3 py-1">Account</th><th className="px-3 py-1 text-right">Debit</th><th className="px-3 py-1 text-right">Credit</th><th className="px-3 py-1">Note</th></tr>
                    </thead>
                    <tbody>
                      {e.journal_lines.map((l: any) => (
                        <tr key={l.id} className="border-t border-border">
                          <td className="px-3 py-1.5"><span className="font-mono text-xs">{l.accounts?.code}</span> · {l.accounts?.name}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{Number(l.debit) > 0 ? `$${Number(l.debit).toFixed(2)}` : ""}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{Number(l.credit) > 0 ? `$${Number(l.credit).toFixed(2)}` : ""}</td>
                          <td className="px-3 py-1.5 text-xs text-muted-foreground">{l.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            );
          })}
        </div>
      )}

      {open && <ManualEntryDialog onClose={() => setOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["journal-entries"] })} />}
    </div>
  );
}

function ManualEntryDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState<Array<{ account_id: string; debit: string; credit: string; description: string }>>([
    { account_id: "", debit: "", credit: "", description: "" },
    { account_id: "", debit: "", credit: "", description: "" },
  ]);

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts-active"],
    queryFn: async () => {
      const { data } = await supabase.from("accounts").select("id, code, name, type").eq("is_active", true).order("code");
      return data ?? [];
    },
  });

  const totalDr = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCr = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const balanced = totalDr > 0 && Math.abs(totalDr - totalCr) < 0.01;

  const save = useMutation({
    mutationFn: async () => {
      if (!balanced) throw new Error("Entry must be balanced (debits = credits)");
      const valid = lines.filter((l) => l.account_id && ((Number(l.debit) || 0) > 0 || (Number(l.credit) || 0) > 0));
      if (valid.length < 2) throw new Error("At least 2 lines required");
      const { data: e, error } = await supabase
        .from("journal_entries")
        .insert({ entry_date: date, memo, source_type: "manual", status: "posted" })
        .select()
        .single();
      if (error) throw error;
      const { error: lerr } = await supabase.from("journal_lines").insert(
        valid.map((l) => ({
          entry_id: e.id,
          account_id: l.account_id,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          description: l.description,
        })),
      );
      if (lerr) throw lerr;
    },
    onSuccess: () => { toast.success("Entry posted"); onSaved(); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <FormDialog
      open
      onClose={onClose}
      title="Manual journal entry"
      size="lg"
      footer={
        <>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton disabled={!balanced || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? "Posting…" : `Post entry · $${totalDr.toFixed(2)}`}
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldGroup label="Date" required><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FieldGroup>
          <FieldGroup label="Memo"><Input value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Description of the transaction" /></FieldGroup>
        </div>

        <div className="rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-xs uppercase text-navy">
              <tr><th className="px-3 py-2">Account</th><th className="px-3 py-2 text-right">Debit</th><th className="px-3 py-2 text-right">Credit</th><th className="px-3 py-2">Note</th><th></th></tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-2 py-1.5">
                    <Select value={l.account_id} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, account_id: e.target.value } : x)))}>
                      <option value="">Select…</option>
                      {(accounts as any[]).map((a) => (<option key={a.id} value={a.id}>{a.code} — {a.name}</option>))}
                    </Select>
                  </td>
                  <td className="px-2 py-1.5">
                    <Input type="number" step="0.01" min="0" value={l.debit} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, debit: e.target.value, credit: "" } : x)))} className="text-right" />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input type="number" step="0.01" min="0" value={l.credit} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, credit: e.target.value, debit: "" } : x)))} className="text-right" />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input value={l.description} onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
                  </td>
                  <td className="px-2 py-1.5">
                    <button onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} className="text-rose-500 hover:text-rose-700"><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/20 font-bold">
                <td className="px-3 py-2">Totals</td>
                <td className="px-3 py-2 text-right font-mono">${totalDr.toFixed(2)}</td>
                <td className="px-3 py-2 text-right font-mono">${totalCr.toFixed(2)}</td>
                <td colSpan={2} className={`px-3 py-2 ${balanced ? "text-emerald-600" : "text-rose-600"}`}>{balanced ? "Balanced" : `Out of balance by $${Math.abs(totalDr - totalCr).toFixed(2)}`}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <GhostButton onClick={() => setLines((ls) => [...ls, { account_id: "", debit: "", credit: "", description: "" }])}>
          <Plus className="h-4 w-4" /> Add line
        </GhostButton>
      </div>
    </FormDialog>
  );
}