import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { CreditCard, RotateCcw, Check, AlertCircle, Receipt } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Pill, statusTone, TableShell, EmptyState, StatCard } from "@/components/admin/ui";
import { FormDialog, FieldGroup, Input, Select, Textarea, PrimaryButton, GhostButton } from "@/components/admin/FormDialog";
import { swal } from "@/lib/swal";

export const Route = createFileRoute("/admin/payments")({ component: PaymentsAdmin });

type RefundCtx = { payment: any; booking: any; alreadyRefunded?: number } | null;

function PaymentsAdmin() {
  const qc = useQueryClient();
  const [refundCtx, setRefundCtx] = useState<RefundCtx>(null);

  const { data: payments = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payments")
        .select("*, bookings(id, reference, daily_rate, days, total, customer_id, customers(full_name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Per-parent refunded totals (sum of |amount| of refund children)
  const refundedByParent = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of payments as any[]) {
      if (p.parent_payment_id) {
        const prev = m.get(p.parent_payment_id) ?? 0;
        m.set(p.parent_payment_id, prev + Math.abs(Number(p.amount ?? 0)));
      }
    }
    return m;
  }, [payments]);

  const totals = (payments as any[]).reduce(
    (acc, p) => {
      acc.count += 1;
      const a = Number(p.amount ?? 0);
      if (p.status === "paid") acc.paid += a;
      if (p.status === "refunded") acc.refunded += Math.abs(a);
      if (p.status === "pending") acc.pending += a;
      return acc;
    },
    { count: 0, paid: 0, refunded: 0, pending: 0 },
  );

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("payments")
        .update({ status: status as any, paid_at: status === "paid" ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payments"] }); toast.success("Payment updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Payments" subtitle="Transactions, refunds and reconciliation" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Transactions" value={totals.count} icon={CreditCard} tone="cyan" />
        <StatCard label="Paid" value={`$${totals.paid.toLocaleString()}`} icon={Check} tone="emerald" />
        <StatCard label="Pending" value={`$${totals.pending.toLocaleString()}`} icon={AlertCircle} tone="amber" />
        <StatCard label="Refunded" value={`$${totals.refunded.toLocaleString()}`} icon={RotateCcw} tone="rose" />
      </div>

      {payments.length === 0 ? <EmptyState icon={CreditCard} title="No payments yet" body="Payments will appear here as bookings are paid." /> : (
        <TableShell>
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
            <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Booking</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {(payments as any[]).map((p) => (
              <tr key={p.id} className="border-t border-border hover:bg-muted/20 transition">
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.bookings?.reference ?? "—"}</td>
                <td className="px-4 py-3">{p.bookings?.customers?.full_name ?? "—"}</td>
                <td className="px-4 py-3 uppercase text-xs">
                  <span className="rounded-full bg-muted px-2 py-0.5">{p.method}</span>
                </td>
                <td className={`px-4 py-3 font-semibold ${Number(p.amount) < 0 ? "text-rose-600" : ""}`}>
                  {Number(p.amount) < 0 && "−"}${Math.abs(Number(p.amount)).toFixed(2)}
                </td>
                <td className="px-4 py-3"><Pill tone={statusTone(p.status)}>{p.status}</Pill></td>
                <td className="px-4 py-3 text-right">
                  {p.status === "pending" && (
                    <button onClick={() => setStatus.mutate({ id: p.id, status: "paid" })} className="mr-1 inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700">
                      <Check className="h-3 w-3" /> Mark paid
                    </button>
                  )}
                  {p.status === "paid" && p.bookings && (
                    <button onClick={() => setRefundCtx({ payment: p, booking: p.bookings, alreadyRefunded: refundedByParent.get(p.id) ?? 0 })}
                      className="inline-flex items-center gap-1 rounded-md bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-600">
                      <RotateCcw className="h-3 w-3" /> Refund
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <RefundDialog ctx={refundCtx} onClose={() => setRefundCtx(null)} />
    </div>
  );
}

function RefundDialog({ ctx, onClose }: { ctx: RefundCtx; onClose: () => void }) {
  const qc = useQueryClient();
  const [days, setDays] = useState(1);
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState("zaad");

  const booking = ctx?.booking;
  const payment = ctx?.payment;
  const dailyRate = Number(booking?.daily_rate ?? 0);
  const paidAmount = Number(payment?.amount ?? 0);
  const alreadyRefunded = Number(ctx?.alreadyRefunded ?? 0);
  const maxRefundAmount = Math.max(0, paidAmount - alreadyRefunded);
  const totalDays = Number(booking?.days ?? 1);
  // days cap = min(booking days, remaining refundable / dailyRate)
  const maxDays = Math.max(
    1,
    Math.min(totalDays, dailyRate > 0 ? Math.floor(maxRefundAmount / dailyRate) : totalDays),
  );

  const safeDays = useMemo(() => {
    const n = Math.floor(Number(days) || 0);
    return Math.max(1, Math.min(maxDays, n));
  }, [days, maxDays]);

  const amount = useMemo(
    () => Math.min(safeDays * dailyRate, maxRefundAmount),
    [safeDays, dailyRate, maxRefundAmount],
  );
  const exceedsCap = amount > maxRefundAmount + 0.001;

  const refund = useMutation({
    mutationFn: async () => {
      if (!payment || !booking) throw new Error("Missing context");
      // Create negative payment row
      const { error: insErr } = await supabase.from("payments").insert({
        booking_id: booking.id,
        method,
        amount: -amount,
        status: "refunded" as any,
        paid_at: new Date().toISOString(),
        parent_payment_id: payment.id,
        refund_days: safeDays,
        refund_reason: reason || null,
        transaction_ref: `REFUND-${payment.id.slice(0, 8)}`,
      });
      if (insErr) throw insErr;
      // Mark original as refunded if fully refunded
      if (safeDays >= maxDays) {
        await supabase.from("payments").update({ status: "refunded" as any }).eq("id", payment.id);
      }
    },
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["customer-360"] });
      onClose();
      await swal.fire({
        icon: "success",
        title: "Refund processed",
        html: `<p>Refunded <b>${safeDays}</b> day${safeDays > 1 ? "s" : ""} · <b>$${amount.toFixed(2)}</b></p>`,
        timer: 2200,
        showConfirmButton: false,
      });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!ctx) return null;

  return (
    <FormDialog
      open
      onClose={onClose}
      title="Process refund"
      subtitle={`Booking ${booking?.reference} · originally paid $${Number(payment?.amount ?? 0).toFixed(2)}`}
      size="md"
      footer={
        <>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton
            disabled={refund.isPending || safeDays < 1 || amount <= 0 || exceedsCap}
            onClick={() => refund.mutate()}
            className="bg-gradient-to-r from-rose-500 to-rose-600"
          >
            <RotateCcw className="h-4 w-4" />
            {refund.isPending ? "Processing…" : `Refund $${amount.toFixed(2)}`}
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <p className="flex items-center gap-2 font-semibold"><AlertCircle className="h-4 w-4" /> Whole days only</p>
          <p className="mt-1 text-rose-700">Refunds are calculated per full day. The total refund can never exceed what the customer originally paid.</p>
          {alreadyRefunded > 0 && (
            <p className="mt-2 text-rose-700">Already refunded: <b>${alreadyRefunded.toFixed(2)}</b> of <b>${paidAmount.toFixed(2)}</b>. Remaining refundable: <b>${maxRefundAmount.toFixed(2)}</b>.</p>
          )}
        </div>

        <FieldGroup label="Number of days to refund" required hint={`Maximum ${maxDays} day${maxDays > 1 ? "s" : ""} from this booking`}>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setDays((d) => Math.max(1, Math.floor(d) - 1))}
              className="h-10 w-10 rounded-md border border-border bg-background text-lg font-bold hover:border-cyan">−</button>
            <Input
              type="number"
              min={1}
              max={maxDays}
              step={1}
              value={safeDays}
              onChange={(e) => setDays(Math.floor(Number(e.target.value) || 1))}
              className="text-center font-display text-xl font-bold"
            />
            <button type="button" onClick={() => setDays((d) => Math.min(maxDays, Math.floor(d) + 1))}
              className="h-10 w-10 rounded-md border border-border bg-background text-lg font-bold hover:border-cyan">+</button>
          </div>
        </FieldGroup>

        <div className="grid gap-3 rounded-xl border border-border bg-gradient-to-br from-cyan/5 to-transparent p-4">
          <Row k="Daily rate" v={`$${dailyRate.toFixed(2)}`} />
          <Row k="Days refunded" v={`× ${safeDays}`} />
          <div className="my-1 border-t border-border" />
          <Row k="Refund amount" v={<span className="font-display text-xl font-bold text-rose-600">${amount.toFixed(2)}</span>} />
        </div>

        <FieldGroup label="Refund method">
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="zaad">Zaad</option>
            <option value="edahab">E-dahab</option>
            <option value="cash">Cash</option>
            <option value="bank">Bank transfer</option>
          </Select>
        </FieldGroup>

        <FieldGroup label="Reason" hint="Visible to staff only">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Vehicle returned early, customer satisfaction…" />
        </FieldGroup>
      </div>
    </FormDialog>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-semibold text-navy">{v}</span>
    </div>
  );
}
