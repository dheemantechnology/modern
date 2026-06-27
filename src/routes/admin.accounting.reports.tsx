import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PieChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard, TableShell } from "@/components/admin/ui";
import { FieldGroup, Input, Select } from "@/components/admin/FormDialog";

export const Route = createFileRoute("/admin/accounting/reports")({ component: ReportsPage });

type Line = { account_id: string; debit: number; credit: number; entry_date: string; accounts: { code: string; name: string; type: string } };

function ReportsPage() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth() - 3, 1).toISOString().slice(0, 10);
  const lastToday = today.toISOString().slice(0, 10);
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(lastToday);
  const [report, setReport] = useState<"trial" | "pl" | "bs">("trial");

  const { data: lines = [] } = useQuery<Line[]>({
    queryKey: ["report-lines", from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_lines")
        .select("debit, credit, account_id, accounts!inner(code, name, type), journal_entries!inner(entry_date)")
        .gte("journal_entries.entry_date", from)
        .lte("journal_entries.entry_date", to);
      if (error) throw error;
      return (data ?? []).map((l: any) => ({
        account_id: l.account_id,
        debit: Number(l.debit),
        credit: Number(l.credit),
        entry_date: l.journal_entries.entry_date,
        accounts: l.accounts,
      }));
    },
  });

  const byAccount = useMemo(() => {
    const m = new Map<string, { code: string; name: string; type: string; debit: number; credit: number; balance: number }>();
    for (const l of lines) {
      const k = l.accounts.code;
      const cur = m.get(k) ?? { code: l.accounts.code, name: l.accounts.name, type: l.accounts.type, debit: 0, credit: 0, balance: 0 };
      cur.debit += l.debit;
      cur.credit += l.credit;
      const sign = l.accounts.type === "asset" || l.accounts.type === "expense" ? 1 : -1;
      cur.balance += sign * (l.debit - l.credit);
      m.set(k, cur);
    }
    return [...m.values()].sort((a, b) => a.code.localeCompare(b.code));
  }, [lines]);

  const totals = useMemo(() => {
    const t = { revenue: 0, expense: 0, asset: 0, liability: 0, equity: 0 };
    for (const a of byAccount) {
      if (a.type === "income") t.revenue += -a.balance;
      if (a.type === "expense") t.expense += a.balance;
      if (a.type === "asset") t.asset += a.balance;
      if (a.type === "liability") t.liability += -a.balance;
      if (a.type === "equity") t.equity += -a.balance;
    }
    return { ...t, net: t.revenue - t.expense };
  }, [byAccount]);

  return (
    <div>
      <PageHeader title="Financial Reports" subtitle="Trial balance, P&L and balance sheet" />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <FieldGroup label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></FieldGroup>
        <FieldGroup label="To"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></FieldGroup>
        <FieldGroup label="Report">
          <Select value={report} onChange={(e) => setReport(e.target.value as any)}>
            <option value="trial">Trial Balance</option>
            <option value="pl">Profit &amp; Loss</option>
            <option value="bs">Balance Sheet</option>
          </Select>
        </FieldGroup>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Revenue" value={`$${totals.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={PieChart} tone="emerald" />
        <StatCard label="Expenses" value={`$${totals.expense.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={PieChart} tone="rose" />
        <StatCard label="Net profit" value={`$${totals.net.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={PieChart} tone={totals.net >= 0 ? "emerald" : "rose"} />
        <StatCard label="Total assets" value={`$${totals.asset.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={PieChart} tone="cyan" />
      </div>

      {report === "trial" && (
        <TableShell>
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
            <tr><th className="px-3 py-2">Code</th><th className="px-3 py-2">Account</th><th className="px-3 py-2">Type</th><th className="px-3 py-2 text-right">Debit</th><th className="px-3 py-2 text-right">Credit</th><th className="px-3 py-2 text-right">Balance</th></tr>
          </thead>
          <tbody>
            {byAccount.map((a) => (
              <tr key={a.code} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-xs">{a.code}</td>
                <td className="px-3 py-2">{a.name}</td>
                <td className="px-3 py-2 text-xs capitalize text-muted-foreground">{a.type}</td>
                <td className="px-3 py-2 text-right font-mono">${a.debit.toFixed(2)}</td>
                <td className="px-3 py-2 text-right font-mono">${a.credit.toFixed(2)}</td>
                <td className="px-3 py-2 text-right font-mono font-bold">${a.balance.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      {report === "pl" && (
        <div className="space-y-6">
          <PLSection title="Revenue" rows={byAccount.filter((a) => a.type === "income")} sign={-1} total={totals.revenue} tone="emerald" />
          <PLSection title="Expenses" rows={byAccount.filter((a) => a.type === "expense")} sign={1} total={totals.expense} tone="rose" />
          <div className="rounded-2xl border border-cyan/30 bg-cyan/5 p-5 text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Net profit</p>
            <p className={`font-display text-3xl font-bold ${totals.net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>${totals.net.toFixed(2)}</p>
          </div>
        </div>
      )}

      {report === "bs" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <PLSection title="Assets" rows={byAccount.filter((a) => a.type === "asset")} sign={1} total={totals.asset} tone="cyan" />
          <div className="space-y-6">
            <PLSection title="Liabilities" rows={byAccount.filter((a) => a.type === "liability")} sign={-1} total={totals.liability} tone="amber" />
            <PLSection title="Equity (+ retained)" rows={byAccount.filter((a) => a.type === "equity")} sign={-1} total={totals.equity + totals.net} tone="emerald" />
          </div>
        </div>
      )}
    </div>
  );
}

function PLSection({ title, rows, sign, total, tone }: { title: string; rows: any[]; sign: number; total: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <h3 className="mb-3 font-display text-lg font-bold text-navy">{title}</h3>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((a) => (
            <tr key={a.code} className="border-b border-border/50">
              <td className="py-1.5 text-xs font-mono text-muted-foreground">{a.code}</td>
              <td className="py-1.5">{a.name}</td>
              <td className="py-1.5 text-right font-mono">${(sign * a.balance).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-navy/20 font-bold">
            <td colSpan={2} className="pt-2">Total {title}</td>
            <td className="pt-2 text-right font-mono">${total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}