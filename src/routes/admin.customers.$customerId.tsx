import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft, Award, Mail, Phone, MapPin, CalendarCheck, CreditCard, FileText,
  ShieldCheck, MessageSquare, Plus, Send, Cake, ExternalLink, AlertTriangle, Clock,
  Sparkles, Receipt, UserCheck, ArrowRight, History,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Pill, statusTone, TableShell, StatCard } from "@/components/admin/ui";
import { Textarea, PrimaryButton } from "@/components/admin/FormDialog";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";
import { BookingProfileDialog } from "@/components/admin/BookingProfileDialog";

export const Route = createFileRoute("/admin/customers/$customerId")({
  component: CustomerProfile,
});

const TABS = ["Overview", "Bookings", "Payments", "Invoices", "Documents", "Lead history", "Notes"] as const;

function CustomerProfile() {
  const { customerId } = Route.useParams();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [viewBooking, setViewBooking] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["customer-360", customerId],
    queryFn: async () => {
      const [{ data: customer }, { data: bookings }, { data: payments }, { data: invoices }, { data: notes }] = await Promise.all([
        supabase.from("customers").select("*").eq("id", customerId).single(),
        supabase.from("bookings").select("id, reference, status, start_date, end_date, days, total, daily_rate, documents, channel, fleet_unit_id, vehicles(name), fleet_units(plate_number)").eq("customer_id", customerId).order("created_at", { ascending: false }),
        supabase.from("payments").select("id, amount, method, status, created_at, refund_days, refund_reason, bookings!inner(id, customer_id, reference)").eq("bookings.customer_id", customerId).order("created_at", { ascending: false }),
        supabase.from("invoices").select("id, number, amount, issued_at, pdf_url, bookings!inner(id, customer_id, reference)").eq("bookings.customer_id", customerId).order("issued_at", { ascending: false }),
        supabase.from("customer_notes").select("*").eq("customer_id", customerId).order("created_at", { ascending: false }),
      ]);

      let lead: any = null;
      let leadActivities: any[] = [];
      if (customer?.converted_from_lead_id) {
        const [{ data: l }, { data: la }] = await Promise.all([
          supabase.from("leads").select("id, reference, full_name, source, score, stage, campaign_id, expected_value, created_at, converted_at, campaigns(name)").eq("id", customer.converted_from_lead_id).maybeSingle(),
          supabase.from("lead_activities").select("*").eq("lead_id", customer.converted_from_lead_id).order("created_at", { ascending: false }),
        ]);
        lead = l; leadActivities = la ?? [];
      }
      return { customer, bookings: bookings ?? [], payments: payments ?? [], invoices: invoices ?? [], notes: notes ?? [], lead, leadActivities };
    },
  });

  if (isLoading || !data?.customer) {
    return <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading customer…</div>;
  }

  const c = data.customer;
  const bookings = data.bookings;
  const payments = data.payments;
  const invoices = data.invoices;
  const notes = data.notes;
  const lead = data.lead;
  const leadActivities = data.leadActivities;

  const totalSpend = Number(c.lifetime_value ?? 0);
  const completed = bookings.filter((b: any) => b.status === "completed").length;
  const avgDays = bookings.length ? Math.round(bookings.reduce((s, b: any) => s + Number(b.days ?? 0), 0) / bookings.length) : 0;
  const lastActivity = bookings[0]?.start_date ?? "—";
  const licenseExpiry = c.license_expiry ? new Date(c.license_expiry) : null;
  const licenseExpiresSoon = licenseExpiry && (licenseExpiry.getTime() - Date.now()) / 86400000 < 60;

  return (
    <div>
      <Link to="/admin/customers" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-cyan">
        <ArrowLeft className="h-4 w-4" /> Back to customers
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy to-cyan p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-cyan/30 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            {c.avatar_url ? (
              <img src={c.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover ring-4 ring-white/30" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 font-display text-2xl font-bold ring-4 ring-white/30">
                {(c.full_name ?? "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-widest text-cyan/80">Customer profile</p>
              <h1 className="mt-1 font-display text-2xl font-bold md:text-3xl">{c.full_name}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur capitalize">
                  <Award className="h-3 w-3" /> {c.loyalty_tier ?? "bronze"}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.kyc_status === "approved" ? "bg-emerald-400/30" : c.kyc_status === "rejected" ? "bg-rose-400/30" : "bg-amber-400/30"}`}>
                  <ShieldCheck className="h-3 w-3" /> KYC {c.kyc_status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {c.phone && (
              <a href={`tel:${c.phone}`} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold hover:bg-white/20">
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
            )}
            {c.phone && (
              <a href={`https://wa.me/${c.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold hover:bg-emerald-600">
                <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
              </a>
            )}
            {c.email && (
              <a href={`mailto:${c.email}`} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-navy hover:bg-cyan">
                <Mail className="h-3.5 w-3.5" /> Email
              </a>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Lifetime spend" value={`$${totalSpend.toLocaleString()}`} icon={CreditCard} tone="emerald" />
        <StatCard label="Total bookings" value={bookings.length} hint={`${completed} completed`} icon={CalendarCheck} tone="cyan" />
        <StatCard label="Avg rental days" value={avgDays || "—"} icon={Clock} tone="amber" />
        <StatCard label="Last activity" value={lastActivity} icon={ExternalLink} tone="rose" />
      </div>

      {licenseExpiresSoon && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <p>License expires on <b>{c.license_expiry}</b> — please request a renewed copy before the next rental.</p>
        </div>
      )}

      {lead && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-cyan/10 p-4 text-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-emerald-800">Converted from lead {lead.reference}</p>
              <p className="text-xs text-emerald-700">
                Source: <span className="capitalize">{String(lead.source ?? "—").replace("_"," ")}</span>
                {lead.campaigns?.name && <> · Campaign: <b>{lead.campaigns.name}</b></>}
                {lead.converted_at && <> · Converted {new Date(lead.converted_at).toLocaleDateString()}</>}
              </p>
            </div>
          </div>
          <Link to="/admin/crm/leads" className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
            View in CRM <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 border-b border-border">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${tab === t ? "border-cyan text-cyan" : "border-transparent text-muted-foreground hover:text-navy"}`}>
              {t}
              {t === "Lead history" && leadActivities.length > 0 && <span className="ml-1 rounded-full bg-cyan/20 px-1.5 text-[10px] font-bold text-cyan">{leadActivities.length}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {tab === "Overview" && <OverviewTab c={c} bookings={bookings} payments={payments} onOpen={setViewBooking} />}
        {tab === "Bookings" && <BookingsTab bookings={bookings} onOpen={setViewBooking} />}
        {tab === "Payments" && <PaymentsTab payments={payments} onOpen={setViewBooking} />}
        {tab === "Invoices" && <InvoicesTab invoices={invoices} onOpen={setViewBooking} />}
        {tab === "Documents" && <DocumentsTab c={c} />}
        {tab === "Lead history" && <LeadHistoryTab lead={lead} activities={leadActivities} />}
        {tab === "Notes" && <NotesTab customerId={customerId} notes={notes} />}
      </div>
      <BookingProfileDialog bookingId={viewBooking} onClose={() => setViewBooking(null)} />
    </div>
  );
}

function OverviewTab({ c, bookings, payments, onOpen }: any) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
        <h3 className="font-display text-lg font-bold text-navy">Contact & profile</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
          <Info icon={Mail} label="Email" value={c.email ?? "—"} />
          <Info icon={Phone} label="Phone" value={c.phone ?? "—"} />
          <Info icon={MapPin} label="Address" value={[c.address, c.city].filter(Boolean).join(", ") || "—"} />
          <Info icon={Cake} label="Date of birth" value={c.date_of_birth ?? "—"} />
          <Info icon={ShieldCheck} label="National ID" value={c.national_id ?? "—"} />
          <Info icon={FileText} label="License" value={c.license_no ? `${c.license_no} (exp ${c.license_expiry ?? "—"})` : "—"} />
        </div>
        {c.notes && (
          <div className="mt-5 rounded-xl bg-muted/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Internal notes</p>
            <p className="mt-1 text-sm">{c.notes}</p>
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h3 className="font-display text-lg font-bold text-navy">Activity</h3>
        <ul className="mt-3 space-y-3">
          {bookings.slice(0, 3).map((b: any) => (
            <li key={b.id} onClick={() => onOpen?.(b.id)} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 -m-2 text-sm hover:bg-muted/50">
              <div className="mt-1 h-2 w-2 rounded-full bg-cyan" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold text-navy">{b.vehicles?.name ?? "Vehicle"}</p>
                <p className="text-xs text-muted-foreground">{b.start_date} · ${Number(b.total).toFixed(0)}</p>
              </div>
              <Pill tone={statusTone(b.status)}>{String(b.status).replace("_", " ")}</Pill>
            </li>
          ))}
          {bookings.length === 0 && <li className="text-sm text-muted-foreground">No bookings yet.</li>}
        </ul>
      </div>
    </div>
  );
}

function BookingsTab({ bookings, onOpen }: any) {
  if (bookings.length === 0) return <Empty label="No bookings for this customer." />;
  return (
    <TableShell>
      <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
        <tr><th className="px-4 py-3">Ref</th><th className="px-4 py-3">Vehicle · Plate</th><th className="px-4 py-3">Dates</th><th className="px-4 py-3">Days</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Total</th></tr>
      </thead>
      <tbody>
        {bookings.map((b: any) => (
          <tr key={b.id} onClick={() => onOpen?.(b.id)} className="cursor-pointer border-t border-border hover:bg-muted/30">
            <td className="px-4 py-3 font-mono text-xs">{b.reference}</td>
            <td className="px-4 py-3">
              <div>{b.vehicles?.name ?? "—"}</div>
              {b.fleet_units?.plate_number && <div className="text-[11px] font-mono text-emerald-700">{b.fleet_units.plate_number}</div>}
            </td>
            <td className="px-4 py-3 text-xs text-muted-foreground">{b.start_date} → {b.end_date}</td>
            <td className="px-4 py-3">{b.days ?? "—"}</td>
            <td className="px-4 py-3"><Pill tone={statusTone(b.status)}>{String(b.status).replace("_", " ")}</Pill></td>
            <td className="px-4 py-3 text-right font-semibold">${Number(b.total).toFixed(0)}</td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}

function PaymentsTab({ payments, onOpen }: any) {
  if (payments.length === 0) return <Empty label="No payments yet." />;
  return (
    <TableShell>
      <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
        <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Booking</th><th className="px-4 py-3">Method</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Amount</th></tr>
      </thead>
      <tbody>
        {payments.map((p: any) => (
          <tr key={p.id} onClick={() => p.bookings?.id && onOpen?.(p.bookings.id)} className={`border-t border-border ${p.bookings?.id ? "cursor-pointer hover:bg-muted/30" : ""}`}>
            <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
            <td className="px-4 py-3 font-mono text-xs">{p.bookings?.reference ?? "—"}</td>
            <td className="px-4 py-3 capitalize text-xs">{p.method}</td>
            <td className="px-4 py-3"><Pill tone={statusTone(p.status)}>{p.status}</Pill></td>
            <td className="px-4 py-3 text-right font-semibold">${Number(p.amount).toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}

function DocumentsTab({ c }: any) {
  return <DocsBlock c={c} />;
}

function DocsBlock({ c }: any) {
  const items = [
    { label: "National ID", value: c.national_id, expiry: null },
    { label: "Driver's license", value: c.license_no, expiry: c.license_expiry },
  ].filter((i) => i.value);

  if (items.length === 0) return <Empty label="No documents uploaded yet." />;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((d) => (
        <div key={d.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan/10 text-cyan"><FileText className="h-5 w-5" /></div>
            <div className="flex-1">
              <p className="font-semibold text-navy">{d.label}</p>
              <p className="font-mono text-xs text-muted-foreground">{d.value}</p>
              {d.expiry && <p className="mt-1 text-xs text-muted-foreground">Expires {d.expiry}</p>}
            </div>
            <Pill tone={c.kyc_status === "approved" ? "green" : "amber"}>{c.kyc_status === "approved" ? "Verified" : "Pending"}</Pill>
          </div>
        </div>
      ))}
    </div>
  );
}

function InvoicesTab({ invoices, onOpen }: any) {
  if (!invoices || invoices.length === 0) return <Empty label="No invoices issued yet." />;
  return (
    <TableShell>
      <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
        <tr><th className="px-4 py-3">Number</th><th className="px-4 py-3">Booking</th><th className="px-4 py-3">Issued</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3 text-right">PDF</th></tr>
      </thead>
      <tbody>
        {invoices.map((i: any) => (
          <tr key={i.id} onClick={() => i.bookings?.id && onOpen?.(i.bookings.id)} className={`border-t border-border ${i.bookings?.id ? "cursor-pointer hover:bg-muted/30" : ""}`}>
            <td className="px-4 py-3 font-mono text-xs">{i.number}</td>
            <td className="px-4 py-3 font-mono text-xs">{i.bookings?.reference ?? "—"}</td>
            <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(i.issued_at).toLocaleDateString()}</td>
            <td className="px-4 py-3 text-right font-semibold">${Number(i.amount).toFixed(2)}</td>
            <td className="px-4 py-3 text-right">
              {i.pdf_url
                ? <a href={i.pdf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-cyan hover:underline"><Receipt className="h-3 w-3" /> Download</a>
                : <span className="text-xs text-muted-foreground">—</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}

function LeadHistoryTab({ lead, activities }: { lead: any; activities: any[] }) {
  if (!lead) return <Empty label="This customer was not converted from a lead." />;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-4 rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan">
            <Sparkles className="h-4 w-4" /> Lead journey
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {activities.length} touchpoint{activities.length === 1 ? "" : "s"} captured before conversion.
          </p>
        </div>
        {activities.length === 0 && <Empty label="No activity was logged on this lead." />}
        <ul className="space-y-3">
          {activities.map((a) => (
            <li key={a.id} className="flex gap-3">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan/15 text-cyan">
                <History className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 rounded-lg border border-border bg-card p-3 shadow-sm">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-navy capitalize">{String(a.kind).replace("_"," ")}</span>
                  <span className="text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                </div>
                {a.body && <p className="mt-1 text-sm text-foreground/80 whitespace-pre-wrap">{a.body}</p>}
                {a.old_stage && a.new_stage && (
                  <div className="mt-2 flex items-center gap-2 text-[11px]">
                    <Pill tone="muted">{a.old_stage}</Pill>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <Pill tone="cyan">{a.new_stage}</Pill>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-card text-sm space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Original lead</p>
        <p className="font-mono text-xs">{lead.reference}</p>
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Source</span><span className="capitalize font-semibold">{String(lead.source ?? "—").replace("_"," ")}</span></div>
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Score</span><span className="font-semibold">{lead.score}</span></div>
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Expected value</span><span className="font-semibold">${Number(lead.expected_value || 0).toLocaleString()}</span></div>
        {lead.campaigns?.name && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Campaign</span><span className="font-semibold">{lead.campaigns.name}</span></div>}
        <div className="flex justify-between text-xs"><span className="text-muted-foreground">Created</span><span className="font-semibold">{new Date(lead.created_at).toLocaleDateString()}</span></div>
        {lead.converted_at && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Converted</span><span className="font-semibold">{new Date(lead.converted_at).toLocaleDateString()}</span></div>}
      </aside>
    </div>
  );
}

function NotesTab({ customerId, notes }: { customerId: string; notes: any[] }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [body, setBody] = useState("");

  const add = useMutation({
    mutationFn: async (b: string) => {
      const { error } = await supabase.from("customer_notes").insert({ customer_id: customerId, body: b, author_id: user?.id ?? null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customer-360", customerId] }); setBody(""); toast.success("Note added"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        {notes.length === 0 && <Empty label="No notes yet. Add the first one." />}
        {notes.map((n) => (
          <div key={n.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {n.kind}</span>
              <span>{new Date(n.created_at).toLocaleString()}</span>
            </div>
            <p className="mt-2 text-sm">{n.body}</p>
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (body.trim()) add.mutate(body.trim()); }}
        className="h-fit rounded-2xl border border-border bg-card p-5 shadow-card">
        <h4 className="font-semibold text-navy">Add a note</h4>
        <p className="mt-1 text-xs text-muted-foreground">Internal — not visible to the customer.</p>
        <Textarea className="mt-3" rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Customer called about extending rental…" />
        <PrimaryButton className="mt-3 w-full" type="submit" disabled={add.isPending || !body.trim()}>
          <Send className="h-3.5 w-3.5" /> {add.isPending ? "Saving…" : "Save note"}
        </PrimaryButton>
      </form>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan/10 text-cyan"><Icon className="h-4 w-4" /></div>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate font-medium text-navy">{value}</p>
      </div>
    </div>
  );
}
function Empty({ label }: { label: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">{label}</div>;
}
