import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Wallet, Send, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableShell, EmptyState, Pill } from "@/components/admin/ui";
import { FormDialog, FieldGroup, Input, Select, PrimaryButton, GhostButton } from "@/components/admin/FormDialog";

export const Route = createFileRoute("/admin/hr/payroll")({ component: PayrollPage });

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function PayrollPage() {
  const qc = useQueryClient();
  const [openNew, setOpenNew] = useState(false);
  const [viewRun, setViewRun] = useState<string | null>(null);

  const { data: runs = [] } = useQuery({
    queryKey: ["payroll_runs"],
    queryFn: async () => (await supabase.from("payroll_runs").select("*").order("period_year", { ascending: false }).order("period_month", { ascending: false })).data ?? [],
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payroll_runs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll_runs"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Payroll"
        subtitle="Generate monthly payroll runs with allowances, deductions and loan repayments"
        actions={<PrimaryButton onClick={() => setOpenNew(true)}><Plus className="h-4 w-4" /> New payroll run</PrimaryButton>}
      />

      {(runs as any[]).length === 0 ? (
        <EmptyState icon={Wallet} title="No payroll runs" body="Create your first payroll run for the current month." />
      ) : (
        <TableShell>
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Gross</th>
              <th className="px-4 py-3">Net</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(runs as any[]).map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                <td className="px-4 py-3 font-mono text-xs">{r.reference}</td>
                <td className="px-4 py-3">{months[r.period_month - 1]} {r.period_year}</td>
                <td className="px-4 py-3">${Number(r.total_gross).toFixed(2)}</td>
                <td className="px-4 py-3 font-semibold">${Number(r.total_net).toFixed(2)}</td>
                <td className="px-4 py-3"><Pill tone={r.status === "posted" ? "green" : r.status === "cancelled" ? "red" : "amber"}>{r.status}</Pill></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setViewRun(r.id)} className="mr-2 rounded-md border border-border p-1.5 hover:border-cyan"><Eye className="h-3.5 w-3.5" /></button>
                  {r.status !== "posted" && (
                    <button onClick={() => { if (confirm("Delete this draft run?")) del.mutate(r.id); }} className="rounded-md border border-border p-1.5 text-rose-500 hover:border-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      {openNew && <NewRunDialog onClose={() => setOpenNew(false)} onCreated={(id) => { setOpenNew(false); setViewRun(id); }} />}
      {viewRun && <RunDialog runId={viewRun} onClose={() => setViewRun(null)} />}
    </div>
  );
}

function NewRunDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      // 1. fetch active employees with allowances/deductions
      const { data: emps, error: e1 } = await supabase
        .from("employees")
        .select("id, base_salary, employee_allowances(amount, recurring), employee_deductions(amount, recurring)")
        .eq("status", "active");
      if (e1) throw e1;
      if (!emps || emps.length === 0) throw new Error("No active employees");

      // 2. fetch active loans
      const { data: loans } = await supabase.from("loans").select("employee_id, monthly_installment").eq("status", "active");
      const loanByEmp = new Map<string, number>();
      (loans ?? []).forEach((l: any) => loanByEmp.set(l.employee_id, (loanByEmp.get(l.employee_id) ?? 0) + Number(l.monthly_installment || 0)));

      // 3. compute items
      const items = (emps as any[]).map((e) => {
        const allow = (e.employee_allowances ?? []).filter((a: any) => a.recurring).reduce((s: number, a: any) => s + Number(a.amount || 0), 0);
        const ded = (e.employee_deductions ?? []).filter((d: any) => d.recurring).reduce((s: number, d: any) => s + Number(d.amount || 0), 0);
        const loanRepay = loanByEmp.get(e.id) ?? 0;
        const base = Number(e.base_salary || 0);
        const gross = base + allow;
        const net = gross - ded - loanRepay;
        return {
          employee_id: e.id,
          base,
          allowances_total: allow,
          deductions_total: ded,
          loan_repayment: loanRepay,
          advance_repayment: 0,
          gross,
          net,
        };
      });

      const totalGross = items.reduce((s, i) => s + i.gross, 0);
      const totalNet = items.reduce((s, i) => s + i.net, 0);

      // 4. create run
      const { data: run, error: e2 } = await supabase
        .from("payroll_runs")
        .insert({ period_year: year, period_month: month, total_gross: totalGross, total_net: totalNet })
        .select("id")
        .single();
      if (e2) throw e2;

      const { error: e3 } = await supabase
        .from("payroll_items")
        .insert(items.map((i) => ({ ...i, run_id: run.id })));
      if (e3) throw e3;

      toast.success(`Draft run created for ${months[month - 1]} ${year}`);
      onCreated(run.id);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormDialog open onClose={onClose} title="New payroll run" subtitle="Auto-generates items for every active employee">
      <div className="grid grid-cols-2 gap-4">
        <FieldGroup label="Year" required>
          <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </FieldGroup>
        <FieldGroup label="Month" required>
          <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </Select>
        </FieldGroup>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <GhostButton onClick={onClose}>Cancel</GhostButton>
        <PrimaryButton disabled={busy} onClick={create}>{busy ? "Generating…" : "Generate"}</PrimaryButton>
      </div>
    </FormDialog>
  );
}

function RunDialog({ runId, onClose }: { runId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: run } = useQuery({
    queryKey: ["payroll_run", runId],
    queryFn: async () => (await supabase.from("payroll_runs").select("*").eq("id", runId).single()).data,
  });
  const { data: items = [] } = useQuery({
    queryKey: ["payroll_items", runId],
    queryFn: async () => (await supabase.from("payroll_items").select("*, employees(full_name, employee_no)").eq("run_id", runId)).data ?? [],
  });

  const totals = useMemo(() => {
    const list = items as any[];
    return {
      gross: list.reduce((s, i) => s + Number(i.gross || 0), 0),
      net: list.reduce((s, i) => s + Number(i.net || 0), 0),
      ded: list.reduce((s, i) => s + Number(i.deductions_total || 0), 0),
      loan: list.reduce((s, i) => s + Number(i.loan_repayment || 0), 0),
    };
  }, [items]);

  const post = useMutation({
    mutationFn: async () => {
      // Create journal entry: DR Salaries Expense (gross), CR Cash (net), CR Loan Receivable (loan), CR Deductions Payable (ded)
      const { data: accs } = await supabase.from("accounts").select("id, code").in("code", ["6100", "1010", "1150", "2110"]);
      const byCode = new Map<string, string>((accs ?? []).map((a: any) => [a.code, a.id]));
      const salaries = byCode.get("6100");
      const cash = byCode.get("1010");
      if (!salaries || !cash) throw new Error("Missing Salaries Expense (6100) or Cash (1010) account");

      const { data: entry, error: ee } = await supabase
        .from("journal_entries")
        .insert({ entry_date: new Date().toISOString().slice(0, 10), memo: `Payroll ${run?.reference}`, source_type: "payroll", source_id: runId, status: "posted" })
        .select("id")
        .single();
      if (ee) throw ee;

      const lines: any[] = [
        { entry_id: entry.id, account_id: salaries, debit: totals.gross, credit: 0, description: "Gross salaries" },
        { entry_id: entry.id, account_id: cash, debit: 0, credit: totals.net, description: "Net pay" },
      ];
      if (totals.loan > 0 && byCode.get("1150")) lines.push({ entry_id: entry.id, account_id: byCode.get("1150"), debit: 0, credit: totals.loan, description: "Loan repayments" });
      if (totals.ded > 0 && byCode.get("2110")) lines.push({ entry_id: entry.id, account_id: byCode.get("2110"), debit: 0, credit: totals.ded, description: "Deductions payable" });

      // Balance check fallback: if no loan/ded account, put residual into cash
      const dr = lines.reduce((s, l) => s + Number(l.debit), 0);
      const cr = lines.reduce((s, l) => s + Number(l.credit), 0);
      if (Math.abs(dr - cr) > 0.01) {
        const diff = dr - cr;
        lines[1].credit = Number(lines[1].credit) + diff;
      }

      const { error: le } = await supabase.from("journal_lines").insert(lines);
      if (le) throw le;

      const { error: ue } = await supabase
        .from("payroll_runs")
        .update({ status: "posted", posted_at: new Date().toISOString(), journal_entry_id: entry.id })
        .eq("id", runId);
      if (ue) throw ue;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll_runs"] });
      qc.invalidateQueries({ queryKey: ["payroll_run", runId] });
      toast.success("Payroll posted to journal");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <FormDialog
      open
      onClose={onClose}
      title={`Payroll ${run?.reference ?? ""}`}
      subtitle={run ? `${months[run.period_month - 1]} ${run.period_year} · ${run.status}` : ""}
      size="xl"
      footer={
        <>
          <GhostButton onClick={onClose}>Close</GhostButton>
          {run?.status === "draft" && (
            <PrimaryButton disabled={post.isPending} onClick={() => post.mutate()}>
              <Send className="h-4 w-4" /> {post.isPending ? "Posting…" : "Post to journal"}
            </PrimaryButton>
          )}
        </>
      }
    >
      <div className="grid grid-cols-4 gap-3 text-sm">
        <Kpi label="Gross" value={`$${totals.gross.toFixed(2)}`} />
        <Kpi label="Deductions" value={`$${totals.ded.toFixed(2)}`} />
        <Kpi label="Loan repayment" value={`$${totals.loan.toFixed(2)}`} />
        <Kpi label="Net pay" value={`$${totals.net.toFixed(2)}`} tone="emerald" />
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
            <tr>
              <th className="px-3 py-2">Employee</th>
              <th className="px-3 py-2">Base</th>
              <th className="px-3 py-2">Allow.</th>
              <th className="px-3 py-2">Deduct.</th>
              <th className="px-3 py-2">Loan</th>
              <th className="px-3 py-2">Gross</th>
              <th className="px-3 py-2">Net</th>
            </tr>
          </thead>
          <tbody>
            {(items as any[]).map((i) => (
              <tr key={i.id} className="border-t border-border">
                <td className="px-3 py-2"><span className="font-semibold">{i.employees?.full_name}</span> <span className="ml-2 font-mono text-[10px] text-muted-foreground">{i.employees?.employee_no}</span></td>
                <td className="px-3 py-2">${Number(i.base).toFixed(2)}</td>
                <td className="px-3 py-2">${Number(i.allowances_total).toFixed(2)}</td>
                <td className="px-3 py-2 text-rose-600">${Number(i.deductions_total).toFixed(2)}</td>
                <td className="px-3 py-2 text-rose-600">${Number(i.loan_repayment).toFixed(2)}</td>
                <td className="px-3 py-2">${Number(i.gross).toFixed(2)}</td>
                <td className="px-3 py-2 font-semibold">${Number(i.net).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FormDialog>
  );
}

function Kpi({ label, value, tone = "cyan" }: { label: string; value: string; tone?: "cyan" | "emerald" }) {
  return (
    <div className={`rounded-lg border border-border p-3 ${tone === "emerald" ? "bg-emerald-50" : "bg-muted/20"}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold text-navy">{value}</p>
    </div>
  );
}