import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ReceiptText, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Pill, TableShell, EmptyState, StatCard } from "@/components/admin/ui";
import { FormDialog, FieldGroup, Input, Select, Textarea, PrimaryButton, GhostButton } from "@/components/admin/FormDialog";

export const Route = createFileRoute("/admin/accounting/expenses")({ component: ExpensesPage });

function ExpensesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*, expense_categories(name), accounts:payment_account_id(code, name)")
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => (await supabase.from("expense_categories").select("*").order("name")).data ?? [],
  });

  const { data: paymentAccounts = [] } = useQuery({
    queryKey: ["payment-accounts"],
    queryFn: async () => {
      const { data } = await supabase.from("accounts").select("id, code, name").eq("type", "asset").like("code", "10%").order("code");
      return data ?? [];
    },
  });

  const total = (expenses as any[]).reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Recorded business expenses — each posts a journal entry automatically"
        actions={<PrimaryButton onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New expense</PrimaryButton>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total expenses" value={`$${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={ReceiptText} tone="rose" />
        <StatCard label="Entries" value={(expenses as any[]).length} icon={ReceiptText} tone="amber" />
        <StatCard label="Categories used" value={new Set((expenses as any[]).map((e) => e.category_id)).size} icon={ReceiptText} tone="cyan" />
      </div>

      {expenses.length === 0 ? (
        <EmptyState icon={ReceiptText} title="No expenses recorded" body="Add an expense to start tracking your books." />
      ) : (
        <TableShell>
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
            <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Ref</th><th className="px-4 py-3">Vendor</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Paid from</th><th className="px-4 py-3 text-right">Amount</th></tr>
          </thead>
          <tbody>
            {(expenses as any[]).map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="px-4 py-3 text-xs">{new Date(e.expense_date).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-mono text-xs">{e.reference}</td>
                <td className="px-4 py-3">{e.vendor || "—"}</td>
                <td className="px-4 py-3">{e.expense_categories?.name || "—"}</td>
                <td className="px-4 py-3 text-xs">{e.accounts?.name || "—"}</td>
                <td className="px-4 py-3 text-right font-display font-bold text-rose-600">${Number(e.amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      {open && (
        <ExpenseDialog
          categories={categories as any[]}
          paymentAccounts={paymentAccounts as any[]}
          onClose={() => setOpen(false)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["expenses"] }); qc.invalidateQueries({ queryKey: ["journal-entries"] }); }}
        />
      )}
    </div>
  );
}

function ExpenseDialog({ categories, paymentAccounts, onClose, onSaved }: { categories: any[]; paymentAccounts: any[]; onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentAccountId, setPaymentAccountId] = useState(paymentAccounts[0]?.id ?? "");
  const [memo, setMemo] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      const a = Number(amount);
      if (!a || a <= 0) throw new Error("Enter a valid amount");
      const { error } = await supabase.from("expenses").insert({
        expense_date: date,
        vendor,
        amount: a,
        category_id: categoryId || null,
        payment_account_id: paymentAccountId || null,
        memo,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Expense recorded"); onSaved(); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <FormDialog
      open
      onClose={onClose}
      title="New expense"
      footer={
        <>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : "Record expense"}</PrimaryButton>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="Date" required><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FieldGroup>
        <FieldGroup label="Amount" required><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></FieldGroup>
        <FieldGroup label="Vendor"><Input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="ABC Fuel Station" /></FieldGroup>
        <FieldGroup label="Category">
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Select…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </FieldGroup>
        <FieldGroup label="Paid from">
          <Select value={paymentAccountId} onChange={(e) => setPaymentAccountId(e.target.value)}>
            {paymentAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
          </Select>
        </FieldGroup>
        <div className="sm:col-span-2">
          <FieldGroup label="Memo"><Textarea value={memo} onChange={(e) => setMemo(e.target.value)} /></FieldGroup>
        </div>
      </div>
    </FormDialog>
  );
}