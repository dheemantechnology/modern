import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { FileText, Download, CreditCard, RotateCcw, CheckCircle2, XCircle, Clock, Car, MapPin, Calendar, Receipt, KeyRound, Undo2, Gauge, Fuel, Printer, AlertTriangle, ExternalLink, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FormDialog, FieldGroup, Input, Select, Textarea, PrimaryButton, GhostButton } from "@/components/admin/FormDialog";
import { Pill, statusTone } from "@/components/admin/ui";
import { swal } from "@/lib/swal";

type Props = { bookingId: string | null; onClose: () => void };

const PICKUP_LABELS: Record<string, string> = {
  exterior_clean: "Exterior clean & photographed",
  interior_clean: "Interior clean",
  no_visible_damage: "No visible damage",
  tires_ok: "Tires inspected",
  spare_present: "Spare tyre present",
  jack_present: "Jack & toolkit present",
  registration_in_car: "Registration & insurance in car",
  fuel_recorded: "Fuel level recorded",
};
const RETURN_LABELS: Record<string, string> = {
  exterior_ok: "Exterior inspected",
  interior_ok: "Interior inspected",
  damage_noted: "Any damage noted in notes",
  fuel_returned: "Fuel level acceptable",
  spare_present: "Spare tyre returned",
  jack_present: "Jack & toolkit returned",
  personal_items_removed: "Customer items removed",
  keys_returned: "Keys returned",
};

// Mock gateway helpers — simulated for now.
async function mockGatewayCapture(amount: number): Promise<{ ref: string; gateway: string }> {
  await new Promise((r) => setTimeout(r, 900));
  if (amount <= 0) throw new Error("Invalid capture amount");
  return { ref: `CAP-${Math.random().toString(36).slice(2, 10).toUpperCase()}`, gateway: "mock_gateway" };
}
async function mockGatewayRefund(amount: number, originalRef?: string | null): Promise<{ ref: string }> {
  await new Promise((r) => setTimeout(r, 900));
  if (amount <= 0) throw new Error("Invalid refund amount");
  return { ref: `RFD-${(originalRef ?? "").slice(0, 6) || Math.random().toString(36).slice(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}` };
}

export function BookingProfileDialog({ bookingId, onClose }: Props) {
  const qc = useQueryClient();
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState("");

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking-profile", bookingId],
    enabled: !!bookingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, vehicles(id, name, image_url, make, model), fleet_units(id, plate_number), customers(id, full_name, email, phone, license_no, avatar_url)")
        .eq("id", bookingId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["booking-payments", bookingId],
    enabled: !!bookingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("booking_id", bookingId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: invoice } = useQuery({
    queryKey: ["booking-invoice", bookingId],
    enabled: !!bookingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices").select("*").eq("booking_id", bookingId!)
        .order("issued_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const capturePayment = useMutation({
    mutationFn: async () => {
      if (!booking) throw new Error("No booking");
      const amount = Number(booking.total);
      const { ref, gateway } = await mockGatewayCapture(amount);
      const { error } = await supabase.from("payments").insert({
        booking_id: booking.id,
        amount,
        method: "online",
        status: "paid" as any,
        paid_at: new Date().toISOString(),
        transaction_ref: ref,
        gateway,
        gateway_ref: ref,
        gateway_payload: { simulated: true, merchant: "Local Merchant", net: amount },
      });
      if (error) throw error;
      await supabase.from("bookings").update({ status: "confirmed" as any, approved_at: new Date().toISOString() }).eq("id", booking.id);
      // Auto-issue invoice
      await supabase.from("invoices").insert({ booking_id: booking.id, amount });
      return { amount, ref };
    },
    onSuccess: async ({ amount, ref }) => {
      qc.invalidateQueries({ queryKey: ["booking-profile", bookingId] });
      qc.invalidateQueries({ queryKey: ["booking-payments", bookingId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      await swal.fire({
        icon: "success",
        title: "Payment captured",
        html: `<p><b>$${amount.toFixed(2)}</b> transferred to local merchant.</p><p class="mt-1 text-xs font-mono">${ref}</p>`,
        timer: 2400,
        showConfirmButton: false,
      });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const requestRefund = useMutation({
    mutationFn: async () => {
      if (!booking) throw new Error("No booking");
      const captured = payments.find((p: any) => p.status === "paid" && Number(p.amount) > 0);
      if (!captured) throw new Error("No captured payment to refund");
      const amt = Number(refundAmount) || Number(captured.amount);
      if (amt <= 0 || amt > Number(captured.amount)) throw new Error("Invalid amount");
      const { error } = await supabase.from("payments").update({
        refund_status: "requested",
        refund_amount: amt,
        refund_requested_at: new Date().toISOString(),
        refund_reason: refundReason || null,
      }).eq("id", captured.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["booking-payments", bookingId] });
      qc.invalidateQueries({ queryKey: ["refunds"] });
      toast.success("Refund request submitted for approval");
      setRefundAmount("");
      setRefundReason("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const cancelBooking = useMutation({
    mutationFn: async (reason: string) => {
      if (!booking) throw new Error("No booking");
      const { error } = await supabase.from("bookings").update({
        status: "cancelled" as any,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || null,
      }).eq("id", booking.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["booking-profile", bookingId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Booking cancelled");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!bookingId) return null;

  const captured = (payments as any[]).find((p) => p.status === "paid" && Number(p.amount) > 0);
  const hasPendingRefund = captured?.refund_status === "requested";
  const isCancelled = booking?.status === "cancelled";
  const docs: any[] = Array.isArray(booking?.documents) ? booking!.documents : [];

  return (
    <FormDialog
      open
      onClose={onClose}
      title={booking ? `Order ${booking.reference}` : "Loading…"}
      subtitle={booking ? `${booking.channel === "online" ? "Online booking" : "Manual booking"} · ${new Date(booking.created_at).toLocaleString()}` : undefined}
      size="xl"
      footer={
        <>
          <GhostButton onClick={onClose}>Close</GhostButton>
          {booking && !captured && booking.channel === "online" && !isCancelled && (
            <PrimaryButton onClick={() => capturePayment.mutate()} disabled={capturePayment.isPending}>
              <CreditCard className="h-4 w-4" />
              {capturePayment.isPending ? "Processing gateway…" : `Capture $${Number(booking.total).toFixed(2)}`}
            </PrimaryButton>
          )}
        </>
      }
    >
      {isLoading || !booking ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT: customer + vehicle + dates */}
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl border border-border bg-gradient-to-br from-cyan/5 to-transparent p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan/15 text-cyan font-bold">
                  {(booking.customers?.full_name ?? "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Customer</p>
                  {booking.customers?.id ? (
                    <Link
                      to="/admin/customers/$customerId"
                      params={{ customerId: booking.customers.id }}
                      onClick={onClose}
                      className="group inline-flex items-center gap-1 font-display text-lg font-bold text-navy hover:text-cyan"
                    >
                      <span className="truncate">{booking.customers.full_name}</span>
                      <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition" />
                    </Link>
                  ) : (
                    <p className="font-display text-lg font-bold text-navy truncate">—</p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {booking.customers?.email && <span>{booking.customers.email}</span>}
                    {booking.customers?.phone && <span>{booking.customers.phone}</span>}
                    {booking.customers?.license_no && <span>License · {booking.customers.license_no}</span>}
                  </div>
                </div>
                <Pill tone={statusTone(booking.status)}>{booking.status.replace("_", " ")}</Pill>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Car className="h-3.5 w-3.5" /> Vehicle</div>
                {booking.fleet_units?.id ? (
                  <Link to="/admin/fleet/vehicles/$unitId" params={{ unitId: booking.fleet_units.id }} onClick={onClose}
                    className="mt-1 inline-flex items-center gap-1 font-semibold text-navy hover:text-cyan">
                    {booking.vehicles?.name ?? "—"}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : (
                  <p className="mt-1 font-semibold text-navy">{booking.vehicles?.name ?? "—"}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {[booking.vehicles?.make, booking.vehicles?.model].filter(Boolean).join(" ")}
                  {booking.fleet_units?.plate_number && <> · <span className="font-mono text-emerald-700">{booking.fleet_units.plate_number}</span></>}
                </p>
              </div>
              <InfoCard icon={MapPin} label="Pickup" value={booking.pickup_location ?? "—"} />
              <InfoCard icon={Calendar} label="Dates" value={`${booking.start_date} → ${booking.end_date}`} hint={`${booking.days ?? "?"} day(s)`} />
              <InfoCard icon={Receipt} label="Total" value={`$${Number(booking.total).toFixed(2)}`} hint={`$${Number(booking.daily_rate).toFixed(2)} / day`} />
            </div>

            {/* Handover report */}
            <HandoverReport booking={booking} />

            {/* Timeline */}
            <Timeline booking={booking} payments={payments as any[]} invoice={invoice} />

            {booking.notes && (
              <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Notes</p>
                <p className="mt-1 text-navy">{booking.notes}</p>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Submitted documents</p>
              {docs.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">No documents uploaded.</p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {docs.map((d, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                      <span className="inline-flex items-center gap-2 truncate"><FileText className="h-4 w-4 text-cyan shrink-0" /><span className="truncate">{d.name ?? `Document ${i + 1}`}</span></span>
                      {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-cyan hover:underline"><Download className="h-3.5 w-3.5" /> Download</a>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {!isCancelled && booking.status !== "completed" && (
              <details className="rounded-xl border border-rose-200 bg-rose-50/50 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-rose-700">Cancel this booking</summary>
                <CancelForm onSubmit={(r) => cancelBooking.mutate(r)} pending={cancelBooking.isPending} />
              </details>
            )}
          </div>

          {/* RIGHT: payment timeline + refund */}
          <div className="space-y-4">
            {invoice && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  <Receipt className="h-3.5 w-3.5" /> Invoice
                </p>
                <p className="mt-1 font-mono text-sm font-bold text-navy">{invoice.number}</p>
                <p className="text-xs text-muted-foreground">
                  Issued {new Date(invoice.issued_at).toLocaleDateString()} · ${Number(invoice.amount).toFixed(2)}
                </p>
                <button
                  type="button"
                  onClick={() => printInvoice(invoice, booking)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                >
                  <Printer className="h-3.5 w-3.5" /> Print / PDF
                </button>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment timeline</p>
              {payments.length === 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">No payments yet.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {(payments as any[]).map((p) => (
                    <li key={p.id} className="border-l-2 border-cyan/40 pl-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</span>
                        <Pill tone={statusTone(p.status)}>{p.status}</Pill>
                      </div>
                      <p className={`mt-1 font-display text-lg font-bold ${Number(p.amount) < 0 ? "text-rose-600" : "text-navy"}`}>
                        {Number(p.amount) < 0 ? "−" : ""}${Math.abs(Number(p.amount)).toFixed(2)}
                        <span className="ml-2 text-xs font-normal uppercase text-muted-foreground">{p.method}</span>
                      </p>
                      {p.transaction_ref && <p className="text-[10px] font-mono text-muted-foreground">{p.transaction_ref}</p>}
                      {p.refund_status && p.refund_status !== "none" && (
                        <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                          {p.refund_status === "requested" && <Clock className="h-3 w-3" />}
                          {p.refund_status === "approved" && <CheckCircle2 className="h-3 w-3" />}
                          {p.refund_status === "refunded" && <RotateCcw className="h-3 w-3" />}
                          {p.refund_status === "rejected" && <XCircle className="h-3 w-3" />}
                          Refund · {p.refund_status}
                          {p.refund_amount ? ` · $${Number(p.refund_amount).toFixed(2)}` : ""}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {booking.channel === "online" && captured && !hasPendingRefund && captured.refund_status !== "refunded" && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-rose-700"><RotateCcw className="h-4 w-4" /> Request refund</p>
                <p className="mt-1 text-xs text-rose-600">Submitted for admin approval. Gateway is not called until approved.</p>
                <div className="mt-3 space-y-3">
                  <FieldGroup label="Amount" hint={`Up to $${Number(captured.amount).toFixed(2)}`}>
                    <Input type="number" step="0.01" max={captured.amount} value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder={String(captured.amount)} />
                  </FieldGroup>
                  <FieldGroup label="Reason">
                    <Textarea value={refundReason} onChange={(e) => setRefundReason(e.target.value)} rows={2} placeholder="Customer cancelled, vehicle unavailable…" />
                  </FieldGroup>
                  <button
                    type="button"
                    onClick={() => requestRefund.mutate()}
                    disabled={requestRefund.isPending}
                    className="w-full rounded-md bg-rose-500 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
                  >
                    {requestRefund.isPending ? "Submitting…" : "Submit refund request"}
                  </button>
                </div>
              </div>
            )}

            {hasPendingRefund && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold inline-flex items-center gap-2"><Clock className="h-4 w-4" /> Refund pending approval</p>
                <p className="mt-1 text-xs">Approve from Refunds queue to call gateway.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </FormDialog>
  );
}

function InfoCard({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <p className="mt-1 font-semibold text-navy">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function CancelForm({ onSubmit, pending }: { onSubmit: (r: string) => void; pending: boolean }) {
  const [reason, setReason] = useState("");
  return (
    <div className="mt-3 space-y-2">
      <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Cancellation reason…" />
      <button type="button" onClick={() => onSubmit(reason)} disabled={pending}
        className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
        {pending ? "Cancelling…" : "Confirm cancellation"}
      </button>
    </div>
  );
}

function HandoverReport({ booking }: { booking: any }) {
  const hasPickup = !!booking.pickup_at;
  const hasReturn = !!booking.returned_at;
  if (!hasPickup && !hasReturn) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3 text-xs text-muted-foreground">
        <p className="font-semibold uppercase tracking-wider">Handover report</p>
        <p className="mt-1">No pickup or return recorded yet. Run the checklist in Rental Operations to log it here.</p>
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {hasPickup && (
        <HandoverPanel
          title="Pickup"
          icon={KeyRound}
          tone="emerald"
          when={booking.pickup_at}
          odometer={booking.pickup_odometer}
          fuel={booking.pickup_fuel}
          notes={booking.pickup_notes}
          checklist={booking.pickup_checklist}
          labels={PICKUP_LABELS}
          signatureUrl={booking.pickup_signature_url}
        />
      )}
      {hasReturn && (
        <HandoverPanel
          title="Return"
          icon={Undo2}
          tone="cyan"
          when={booking.returned_at}
          odometer={booking.return_odometer}
          fuel={booking.return_fuel}
          notes={booking.return_notes}
          checklist={booking.return_checklist}
          labels={RETURN_LABELS}
          signatureUrl={booking.return_signature_url}
        />
      )}
      {hasPickup && hasReturn && booking.pickup_odometer != null && booking.return_odometer != null && (
        <div className="sm:col-span-2 rounded-xl border border-cyan/30 bg-cyan/5 p-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan">Distance driven</p>
          <p className="mt-1 font-display text-xl font-bold text-navy">
            {(Number(booking.return_odometer) - Number(booking.pickup_odometer)).toLocaleString()} km
          </p>
        </div>
      )}
    </div>
  );
}

function HandoverPanel({ title, icon: Icon, tone, when, odometer, fuel, notes, checklist, labels, signatureUrl }: any) {
  const checks: Record<string, any> = checklist ?? {};
  const issues: Record<string, string> = checks.__issues ?? {};
  const items = Object.keys(labels);
  const passed = items.filter((k) => checks[k]);
  const failed = items.filter((k) => !checks[k] && (Object.prototype.hasOwnProperty.call(checks, k) || issues[k]));
  const toneRing = tone === "emerald" ? "border-emerald-200 bg-emerald-50/30" : "border-cyan/30 bg-cyan/5";
  const toneText = tone === "emerald" ? "text-emerald-700" : "text-cyan";
  return (
    <div className={`rounded-xl border p-3 ${toneRing}`}>
      <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${toneText}`}>
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{new Date(when).toLocaleString()}</p>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md bg-white/60 p-2">
          <div className="flex items-center gap-1 text-muted-foreground"><Gauge className="h-3 w-3" />Odometer</div>
          <p className="mt-0.5 font-semibold text-navy">{odometer != null ? `${Number(odometer).toLocaleString()} km` : "—"}</p>
        </div>
        <div className="rounded-md bg-white/60 p-2">
          <div className="flex items-center gap-1 text-muted-foreground"><Fuel className="h-3 w-3" />Fuel</div>
          <p className="mt-0.5 font-semibold text-navy">{fuel ?? "—"}</p>
        </div>
      </div>
      <div className="mt-2 text-xs">
        <p className="text-muted-foreground"><span className="font-semibold text-emerald-700">{passed.length}</span> passed · <span className="font-semibold text-rose-700">{failed.length}</span> issue{failed.length === 1 ? "" : "s"}</p>
        {failed.length > 0 && (
          <ul className="mt-1.5 space-y-1">
            {failed.map((k) => (
              <li key={k} className="flex items-start gap-1.5 rounded-md bg-rose-50 px-2 py-1 text-rose-800">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                <span><b>{labels[k]}</b>{issues[k] ? <> — <span className="text-rose-700">{issues[k]}</span></> : null}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {notes && <p className="mt-2 rounded-md bg-white/60 p-2 text-xs text-navy whitespace-pre-wrap">{notes}</p>}
      {signatureUrl && (
        <a href={signatureUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-cyan hover:underline">
          <FileText className="h-3 w-3" /> View signature
        </a>
      )}
    </div>
  );
}

function Timeline({ booking, payments, invoice }: { booking: any; payments: any[]; invoice: any }) {
  const events: Array<{ when: string; label: string; tone: string }> = [];
  if (booking.created_at) events.push({ when: booking.created_at, label: "Booking created", tone: "bg-muted" });
  if (booking.approved_at) events.push({ when: booking.approved_at, label: "Approved / confirmed", tone: "bg-emerald-100 text-emerald-700" });
  const firstPay = payments.filter((p) => p.status === "paid" && Number(p.amount) > 0).slice(-1)[0];
  if (firstPay?.paid_at) events.push({ when: firstPay.paid_at, label: `Payment captured · $${Number(firstPay.amount).toFixed(2)}`, tone: "bg-cyan/15 text-cyan" });
  if (invoice?.issued_at) events.push({ when: invoice.issued_at, label: `Invoice ${invoice.number}`, tone: "bg-emerald-100 text-emerald-700" });
  if (booking.pickup_at) events.push({ when: booking.pickup_at, label: "Picked up", tone: "bg-emerald-100 text-emerald-800" });
  if (booking.returned_at) events.push({ when: booking.returned_at, label: "Returned", tone: "bg-cyan/15 text-cyan" });
  if (booking.cancelled_at) events.push({ when: booking.cancelled_at, label: `Cancelled${booking.cancellation_reason ? ` — ${booking.cancellation_reason}` : ""}`, tone: "bg-rose-100 text-rose-700" });
  const refunds = payments.filter((p) => p.refund_status === "refunded" && p.refund_approved_at);
  refunds.forEach((r) => events.push({ when: r.refund_approved_at, label: `Refunded · $${Number(r.refund_amount ?? r.amount).toFixed(2)}`, tone: "bg-amber-100 text-amber-800" }));
  events.sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime());
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timeline</p>
      <ol className="mt-2 space-y-2">
        {events.map((e, i) => (
          <li key={i} className="flex items-start gap-3 text-xs">
            <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-cyan" />
            <span className="text-muted-foreground w-36 shrink-0">{new Date(e.when).toLocaleString()}</span>
            <span className={`inline-flex rounded-full px-2 py-0.5 font-medium ${e.tone}`}>{e.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function printInvoice(inv: any, booking: any) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${inv.number}</title>
    <style>body{font-family:system-ui,sans-serif;padding:40px;color:#0f172a;max-width:780px;margin:auto}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #06b6d4;padding-bottom:16px;margin-bottom:24px}
    h1{margin:0;font-size:24px;color:#0c4a6e} .muted{color:#64748b;font-size:12px}
    table{width:100%;border-collapse:collapse;margin-top:16px} th,td{text-align:left;padding:8px;border-bottom:1px solid #e2e8f0}
    .tot{text-align:right;font-size:20px;font-weight:bold;margin-top:16px;color:#0c4a6e}
    .ftr{margin-top:40px;color:#64748b;font-size:11px;text-align:center}</style></head><body>
    <div class="hdr"><div><h1>INVOICE</h1><p class="muted">${inv.number}</p></div>
    <div style="text-align:right"><p style="margin:0;font-weight:bold">Modern Multi Services</p>
    <p class="muted">Issued ${new Date(inv.issued_at).toLocaleDateString()}</p></div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div><p class="muted">Bill to</p><p style="font-weight:bold;margin:4px 0">${booking?.customers?.full_name ?? "—"}</p>
      <p class="muted">${booking?.customers?.email ?? ""}<br>${booking?.customers?.phone ?? ""}</p></div>
      <div><p class="muted">Booking</p><p style="font-weight:bold;margin:4px 0">${booking?.reference ?? "—"}</p>
      <p class="muted">${booking?.start_date ?? ""} → ${booking?.end_date ?? ""}</p></div>
    </div>
    <table><thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody><tr><td>Vehicle rental · ${booking?.vehicles?.name ?? "—"}</td><td style="text-align:right">$${Number(inv.amount).toFixed(2)}</td></tr></tbody></table>
    <p class="tot">Total: $${Number(inv.amount).toFixed(2)}</p>
    <p class="ftr">Thank you for your business.</p>
    <script>window.onload=()=>window.print()</script></body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

// Exported so other pages can trigger the same refund-approval flow.
export async function approveAndExecuteRefund(paymentId: string): Promise<void> {
  const { data: pay, error } = await supabase.from("payments").select("*").eq("id", paymentId).maybeSingle();
  if (error || !pay) throw new Error("Payment not found");
  const amt = Number(pay.refund_amount ?? pay.amount);
  const { ref } = await mockGatewayRefund(amt, pay.gateway_ref);
  const { error: e1 } = await supabase.from("payments").update({
    refund_status: "refunded",
    refund_approved_at: new Date().toISOString(),
    status: amt >= Number(pay.amount) ? ("refunded" as any) : pay.status,
  }).eq("id", paymentId);
  if (e1) throw e1;
  await supabase.from("payments").insert({
    booking_id: pay.booking_id,
    amount: -amt,
    method: pay.method,
    status: "refunded" as any,
    paid_at: new Date().toISOString(),
    parent_payment_id: pay.id,
    transaction_ref: ref,
    gateway: pay.gateway,
    gateway_ref: ref,
    refund_reason: pay.refund_reason,
    gateway_payload: { simulated: true, returned_to_customer: true },
  });
}

export async function rejectRefund(paymentId: string): Promise<void> {
  const { error } = await supabase.from("payments").update({
    refund_status: "rejected",
    refund_approved_at: new Date().toISOString(),
  }).eq("id", paymentId);
  if (error) throw error;
}