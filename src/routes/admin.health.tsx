import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard, TableShell, Pill } from "@/components/admin/ui";
import { GhostButton } from "@/components/admin/FormDialog";

export const Route = createFileRoute("/admin/health")({ component: HealthPage });

type Severity = "ok" | "warn" | "error";
type Check = { id: string; title: string; severity: Severity; detail: string; rows?: any[] };

function HealthPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["system-health"],
    queryFn: runHealthChecks,
    staleTime: 30_000,
  });

  const checks = data ?? [];
  const errors = checks.filter((c) => c.severity === "error").length;
  const warns = checks.filter((c) => c.severity === "warn").length;
  const oks = checks.filter((c) => c.severity === "ok").length;

  return (
    <div>
      <PageHeader
        title="System Health"
        subtitle="Cross-module integrity checks across bookings, fleet, payments, journal, payroll and expenses"
        actions={
          <GhostButton onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Re-run checks
          </GhostButton>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Passing" value={oks} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Warnings" value={warns} icon={AlertTriangle} tone="amber" />
        <StatCard label="Errors" value={errors} icon={XCircle} tone="rose" />
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Running diagnostics…</div>
      ) : (
        <div className="space-y-4">
          {checks.map((c) => (
            <CheckCard key={c.id} check={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function CheckCard({ check }: { check: Check }) {
  const tone = check.severity === "ok" ? "green" : check.severity === "warn" ? "amber" : "red";
  const Icon = check.severity === "ok" ? CheckCircle2 : check.severity === "warn" ? AlertTriangle : XCircle;
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Icon className={`mt-0.5 h-5 w-5 ${check.severity === "ok" ? "text-emerald-600" : check.severity === "warn" ? "text-amber-600" : "text-rose-600"}`} />
          <div>
            <h3 className="font-semibold text-navy">{check.title}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{check.detail}</p>
          </div>
        </div>
        <Pill tone={tone}>{check.severity.toUpperCase()}</Pill>
      </div>
      {check.rows && check.rows.length > 0 && (
        <div className="mt-4">
          <TableShell>
            <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
              <tr>
                {Object.keys(check.rows[0]).map((k) => (
                  <th key={k} className="px-3 py-2">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {check.rows.slice(0, 25).map((r, i) => (
                <tr key={i} className="border-t border-border">
                  {Object.values(r).map((v: any, j) => (
                    <td key={j} className="px-3 py-2 font-mono text-xs">{String(v ?? "—")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </TableShell>
          {check.rows.length > 25 && (
            <p className="mt-2 text-xs text-muted-foreground">Showing 25 of {check.rows.length} rows.</p>
          )}
        </div>
      )}
    </div>
  );
}

async function runHealthChecks(): Promise<Check[]> {
  const checks: Check[] = [];

  // 1. Bookings ↔ fleet unit status
  {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, reference, status, fleet_unit_id, fleet_units:fleet_unit_id(plate_number, status)")
      .in("status", ["confirmed", "active"])
      .not("fleet_unit_id", "is", null);
    const mismatched = (bookings ?? []).filter((b: any) => b.fleet_units && b.fleet_units.status !== "rented");
    checks.push({
      id: "fleet-status-sync",
      title: "Active bookings have their fleet unit marked rented",
      severity: mismatched.length === 0 ? "ok" : "warn",
      detail: mismatched.length === 0
        ? "Every active/confirmed booking is correctly holding its fleet unit."
        : `${mismatched.length} booking(s) are active but their fleet unit is not marked as rented.`,
      rows: mismatched.map((b: any) => ({ booking: b.reference, status: b.status, plate: b.fleet_units?.plate_number, unit_status: b.fleet_units?.status })),
    });
  }

  // 2. Paid payments without journal entries
  {
    const { data: paidPayments } = await supabase
      .from("payments")
      .select("id, amount, paid_at, status, method")
      .eq("status", "paid")
      .limit(1000);
    const { data: journals } = await supabase
      .from("journal_entries")
      .select("source_id, source_type")
      .in("source_type", ["payment", "refund"]);
    const journaledIds = new Set((journals ?? []).map((j: any) => j.source_id));
    const orphaned = (paidPayments ?? []).filter((p: any) => !journaledIds.has(p.id));
    checks.push({
      id: "payment-journal-sync",
      title: "Every paid payment posts a journal entry",
      severity: orphaned.length === 0 ? "ok" : "error",
      detail: orphaned.length === 0
        ? `All ${paidPayments?.length ?? 0} paid payments have journal entries.`
        : `${orphaned.length} paid payment(s) are missing a journal entry — check the on_payment_journal trigger.`,
      rows: orphaned.slice(0, 25).map((p: any) => ({ id: p.id.slice(0, 8), amount: p.amount, method: p.method, paid_at: p.paid_at })),
    });
  }

  // 3. Expenses without journal entries
  {
    const { data: expenses } = await supabase
      .from("expenses")
      .select("id, reference, vendor, amount, journal_entry_id, category_id, payment_account_id");
    const missing = (expenses ?? []).filter((e: any) =>
      !e.journal_entry_id && e.category_id && e.payment_account_id
    );
    checks.push({
      id: "expense-journal-sync",
      title: "Expenses with category + payment account post a journal entry",
      severity: missing.length === 0 ? "ok" : "warn",
      detail: missing.length === 0
        ? `All ${expenses?.length ?? 0} expenses reconciled to the ledger.`
        : `${missing.length} expense(s) skipped journaling despite having required accounts.`,
      rows: missing.map((e: any) => ({ ref: e.reference, vendor: e.vendor, amount: e.amount })),
    });
  }

  // 4. Journal entries — balanced?
  {
    const { data: lines } = await supabase
      .from("journal_lines")
      .select("entry_id, debit, credit");
    const totals = new Map<string, { d: number; c: number }>();
    (lines ?? []).forEach((l: any) => {
      const t = totals.get(l.entry_id) ?? { d: 0, c: 0 };
      t.d += Number(l.debit || 0);
      t.c += Number(l.credit || 0);
      totals.set(l.entry_id, t);
    });
    const unbalanced = [...totals.entries()].filter(([, t]) => Math.abs(t.d - t.c) > 0.01);
    checks.push({
      id: "journal-balanced",
      title: "All journal entries are balanced (debits = credits)",
      severity: unbalanced.length === 0 ? "ok" : "error",
      detail: unbalanced.length === 0
        ? `${totals.size} journal entries are balanced.`
        : `${unbalanced.length} unbalanced journal entries detected.`,
      rows: unbalanced.slice(0, 25).map(([id, t]) => ({ entry: id.slice(0, 8), debits: t.d.toFixed(2), credits: t.c.toFixed(2), diff: (t.d - t.c).toFixed(2) })),
    });
  }

  // 5. Loans with negative or over-principal balance
  {
    const { data: loans } = await supabase
      .from("loans")
      .select("reference, principal, balance, status, employee_id");
    const bad = (loans ?? []).filter((l: any) => Number(l.balance) < 0 || Number(l.balance) > Number(l.principal));
    checks.push({
      id: "loan-balance",
      title: "Loan balances stay within [0, principal]",
      severity: bad.length === 0 ? "ok" : "error",
      detail: bad.length === 0 ? `${loans?.length ?? 0} loans within bounds.` : `${bad.length} loan(s) have invalid balances.`,
      rows: bad.map((l: any) => ({ ref: l.reference, principal: l.principal, balance: l.balance, status: l.status })),
    });
  }

  // 6. Payroll runs ↔ posted runs have totals matching items
  {
    const { data: runs } = await supabase
      .from("payroll_runs")
      .select("id, reference, status, total_gross, total_net, payroll_items(gross, net)");
    const mismatched = (runs ?? []).filter((r: any) => {
      const sumG = (r.payroll_items ?? []).reduce((s: number, i: any) => s + Number(i.gross || 0), 0);
      const sumN = (r.payroll_items ?? []).reduce((s: number, i: any) => s + Number(i.net || 0), 0);
      return Math.abs(sumG - Number(r.total_gross)) > 0.01 || Math.abs(sumN - Number(r.total_net)) > 0.01;
    });
    checks.push({
      id: "payroll-totals",
      title: "Payroll run totals match the sum of items",
      severity: mismatched.length === 0 ? "ok" : "warn",
      detail: mismatched.length === 0 ? `${runs?.length ?? 0} payroll runs reconciled.` : `${mismatched.length} payroll run(s) have drifted totals.`,
      rows: mismatched.map((r: any) => ({ ref: r.reference, status: r.status, total_gross: r.total_gross, total_net: r.total_net })),
    });
  }

  // 7. CMS pages — required pages seeded
  {
    const { data: pages } = await supabase.from("cms_pages").select("slug");
    const have = new Set((pages ?? []).map((p: any) => p.slug));
    const required = ["home", "about"];
    const missing = required.filter((s) => !have.has(s));
    checks.push({
      id: "cms-seeded",
      title: "Required CMS pages exist",
      severity: missing.length === 0 ? "ok" : "warn",
      detail: missing.length === 0 ? "All required CMS pages are present." : `Missing: ${missing.join(", ")}`,
    });
  }

  // 8. App settings — required keys
  {
    const { data: settings } = await supabase.from("app_settings").select("key");
    const have = new Set((settings ?? []).map((s: any) => s.key));
    const required = ["company", "contact", "social", "hours", "financial", "refundPolicy", "footer", "booking", "seo"];
    const missing = required.filter((k) => !have.has(k));
    checks.push({
      id: "settings-seeded",
      title: "Required settings are configured",
      severity: missing.length === 0 ? "ok" : "warn",
      detail: missing.length === 0 ? `All ${required.length} settings keys present.` : `Missing settings keys: ${missing.join(", ")}`,
    });
  }

  return checks;
}
