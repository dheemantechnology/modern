import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Plus, Search, UserPlus, Phone, Mail, Pencil, Trash2, MessageSquare,
  Calendar, ArrowRight, Sparkles, Target, TrendingUp, Flame, UserCheck,
  CheckCircle2, Clock, History, ListChecks, X, StickyNote, Send, CalendarClock, Users as UsersIcon,
  Car, AlertTriangle, ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Pill, StatCard, EmptyState } from "@/components/admin/ui";
import { FormDialog, FieldGroup, Input, Select, Textarea, PrimaryButton, GhostButton } from "@/components/admin/FormDialog";
import { confirmDelete, notifyDeleted, notifyError, swal } from "@/lib/swal";

export const Route = createFileRoute("/admin/crm/leads")({ component: LeadsAdmin });

const STAGES = ["new","contacted","qualified","proposal","negotiation","won","lost"] as const;
type Stage = typeof STAGES[number];

const STAGE_META: Record<Stage, { label: string; tone: string; dot: string }> = {
  new:         { label: "New",         tone: "bg-slate-100 text-slate-700 border-slate-200",  dot: "bg-slate-400" },
  contacted:   { label: "Contacted",   tone: "bg-blue-100 text-blue-700 border-blue-200",     dot: "bg-blue-500" },
  qualified:   { label: "Qualified",   tone: "bg-cyan/15 text-cyan border-cyan/30",           dot: "bg-cyan" },
  proposal:    { label: "Proposal",    tone: "bg-violet-100 text-violet-700 border-violet-200", dot: "bg-violet-500" },
  negotiation: { label: "Negotiation", tone: "bg-amber-100 text-amber-700 border-amber-200",  dot: "bg-amber-500" },
  won:         { label: "Won",         tone: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  lost:        { label: "Lost",        tone: "bg-rose-100 text-rose-700 border-rose-200",     dot: "bg-rose-500" },
};

const SOURCES = ["website","referral","walk_in","social","campaign","phone","whatsapp","event","other"];

const KIND_META: Record<string, { label: string; tone: string; icon: any }> = {
  note:    { label: "Note",    tone: "bg-slate-500",   icon: StickyNote },
  call:    { label: "Call",    tone: "bg-blue-500",    icon: Phone },
  email:   { label: "Email",   tone: "bg-violet-500",  icon: Mail },
  sms:     { label: "SMS",     tone: "bg-emerald-500", icon: MessageSquare },
  meeting: { label: "Meeting", tone: "bg-amber-500",   icon: Calendar },
  task:    { label: "Task",    tone: "bg-rose-500",    icon: ListChecks },
  stage_change: { label: "Stage", tone: "bg-cyan", icon: ArrowRight },
  conversion:   { label: "Conversion", tone: "bg-emerald-600", icon: UserCheck },
};

function LeadsAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [view, setView] = useState<"board" | "table">("board");
  const [q, setQ] = useState("");

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*, campaigns(name, type)").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns-mini"],
    queryFn: async () => {
      const { data } = await supabase.from("campaigns").select("id, name, type").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles-mini"],
    queryFn: async () => {
      const { data } = await supabase.from("vehicles").select("id, name, daily_rate").order("name");
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (l: any) => {
      const p: any = { ...l };
      delete p.id; delete p.created_at; delete p.updated_at; delete p.campaigns;
      p.expected_value = Number(p.expected_value) || 0;
      p.score = Number(p.score) || 0;
      p.campaign_id = p.campaign_id || null;
      p.expected_close_date = p.expected_close_date || null;
      if (l.id) {
        const { error } = await supabase.from("leads").update(p).eq("id", l.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("leads").insert(p);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); setEditing(null); toast.success("Lead saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const setStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: Stage }) => {
      const { error } = await supabase.from("leads").update({ stage: stage as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); qc.invalidateQueries({ queryKey: ["lead-activities"] }); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
    onError: (e: any) => notifyError(e.message),
  });

  async function handleDelete(l: any) {
    const ok = await confirmDelete({ itemLabel: l.full_name });
    if (!ok) return;
    await del.mutateAsync(l.id);
    await notifyDeleted(l.full_name);
  }

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return leads;
    return (leads as any[]).filter((l) =>
      (l.full_name + " " + (l.email ?? "") + " " + (l.phone ?? "") + " " + (l.reference ?? "")).toLowerCase().includes(s)
    );
  }, [leads, q]);

  const stats = useMemo(() => {
    const l = leads as any[];
    return {
      total: l.length,
      hot: l.filter((x) => x.score >= 70 && !["won","lost"].includes(x.stage)).length,
      won: l.filter((x) => x.stage === "won").length,
      pipeline: l.filter((x) => !["won","lost"].includes(x.stage)).reduce((s, x) => s + Number(x.expected_value || 0), 0),
    };
  }, [leads]);

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="Capture, nurture and convert prospects into paying customers"
        actions={<PrimaryButton onClick={() => setEditing({ full_name: "", source: "other", stage: "new", score: 50 })}><Plus className="h-4 w-4" /> New lead</PrimaryButton>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total leads" value={stats.total} icon={UserPlus} tone="cyan" />
        <StatCard label="Hot prospects" value={stats.hot} icon={Flame} tone="rose" />
        <StatCard label="Won this month" value={stats.won} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Pipeline value" value={`$${stats.pipeline.toLocaleString()}`} icon={TrendingUp} tone="amber" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 max-w-sm flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, phone, email, ref…" className="w-full bg-transparent text-sm outline-none" />
        </div>
        <div className="flex rounded-md border border-border bg-card overflow-hidden">
          {(["board","table"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-2 text-xs font-semibold capitalize ${view === v ? "bg-cyan text-navy" : "text-muted-foreground hover:bg-muted/50"}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={UserPlus} title="No leads yet" body="Capture your first lead from a campaign or walk-in." />
      ) : view === "board" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3 overflow-x-auto">
          {STAGES.map((stage) => {
            const items = (filtered as any[]).filter((l) => l.stage === stage);
            return (
              <div key={stage}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData("lead-id");
                  if (id) setStage.mutate({ id, stage });
                }}
                className="rounded-xl border border-border bg-muted/20 p-2 min-h-[200px]">
                <div className="mb-2 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${STAGE_META[stage].dot}`} />
                    <span className="text-xs font-bold uppercase tracking-wider text-navy">{STAGE_META[stage].label}</span>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground bg-card border border-border rounded-full px-1.5">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((l) => (
                    <div key={l.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("lead-id", l.id)}
                      onClick={() => setProfile(l)}
                      className="cursor-grab active:cursor-grabbing rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md hover:border-cyan transition">
                      <div className="flex items-start gap-2">
                        <Avatar name={l.full_name} score={l.score} />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-navy truncate">{l.full_name}</p>
                          <p className="text-[10px] text-muted-foreground">{l.reference}</p>
                        </div>
                      </div>
                      {l.phone && <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {l.phone}</p>}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-cyan">${Number(l.expected_value || 0).toLocaleString()}</span>
                        {l.campaigns && <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{l.campaigns.name}</span>}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <div className="text-center text-[10px] text-muted-foreground py-4">Drop here</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
              <tr><th className="px-4 py-3">Lead</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Stage</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Value</th><th className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {(filtered as any[]).map((l) => (
                <tr key={l.id} className="border-t border-border hover:bg-muted/20 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={l.full_name} score={l.score} />
                      <div>
                        <button onClick={() => setProfile(l)} className="font-semibold text-navy hover:text-cyan transition">{l.full_name}</button>
                        <p className="text-[10px] text-muted-foreground">{l.reference}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {l.email && <p className="flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground" /> {l.email}</p>}
                    {l.phone && <p className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" /> {l.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs capitalize">{l.source?.replace("_"," ")}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STAGE_META[l.stage as Stage]?.tone}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${STAGE_META[l.stage as Stage]?.dot}`} /> {STAGE_META[l.stage as Stage]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3"><ScoreBar score={l.score} /></td>
                  <td className="px-4 py-3 text-sm font-semibold text-navy">${Number(l.expected_value || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setProfile(l)} className="mr-1 rounded p-1.5 hover:bg-cyan/10" title="Profile"><Sparkles className="h-4 w-4 text-cyan" /></button>
                    <button onClick={() => setEditing(l)} className="mr-1 rounded p-1.5 hover:bg-cyan/10" title="Edit"><Pencil className="h-4 w-4 text-cyan" /></button>
                    <button onClick={() => handleDelete(l)} className="rounded p-1.5 hover:bg-rose-100" title="Delete"><Trash2 className="h-4 w-4 text-rose-600" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit dialog */}
      <FormDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit lead" : "New lead"}
        subtitle="Capture every detail you can — score it for prioritisation"
        size="lg"
        footer={<><GhostButton onClick={() => setEditing(null)}>Cancel</GhostButton><PrimaryButton form="lead-form" type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save lead"}</PrimaryButton></>}
      >
        {editing && (
          <form id="lead-form" onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Full name" required><Input required value={editing.full_name ?? ""} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} /></FieldGroup>
              <FieldGroup label="City"><Input value={editing.city ?? ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} /></FieldGroup>
              <FieldGroup label="Email"><Input type="email" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></FieldGroup>
              <FieldGroup label="Phone"><Input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} placeholder="+252 …" /></FieldGroup>
              <FieldGroup label="Source">
                <Select value={editing.source ?? "other"} onChange={(e) => setEditing({ ...editing, source: e.target.value })}>
                  {SOURCES.map((s) => <option key={s} value={s} className="capitalize">{s.replace("_"," ")}</option>)}
                </Select>
              </FieldGroup>
              <FieldGroup label="Stage">
                <Select value={editing.stage ?? "new"} onChange={(e) => setEditing({ ...editing, stage: e.target.value })}>
                  {STAGES.map((s) => <option key={s} value={s}>{STAGE_META[s].label}</option>)}
                </Select>
              </FieldGroup>
              <FieldGroup label="Campaign">
                <Select value={editing.campaign_id ?? ""} onChange={(e) => setEditing({ ...editing, campaign_id: e.target.value })}>
                  <option value="">— None —</option>
                  {(campaigns as any[]).map((c) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                </Select>
              </FieldGroup>
              <FieldGroup label="Expected close date"><Input type="date" value={editing.expected_close_date ?? ""} onChange={(e) => setEditing({ ...editing, expected_close_date: e.target.value })} /></FieldGroup>
              <FieldGroup label="Expected value ($)"><Input type="number" min={0} step={0.01} value={editing.expected_value ?? 0} onChange={(e) => setEditing({ ...editing, expected_value: e.target.value })} /></FieldGroup>
              <FieldGroup label="Score (0–100)" hint="≥ 70 = hot prospect">
                <Input type="number" min={0} max={100} value={editing.score ?? 50} onChange={(e) => setEditing({ ...editing, score: e.target.value })} />
              </FieldGroup>
              <FieldGroup label="Vehicle of interest" hint="Required to convert this lead">
                <Select value={editing.vehicle_interest_id ?? ""} onChange={(e) => setEditing({ ...editing, vehicle_interest_id: e.target.value || null })}>
                  <option value="">— Not selected yet —</option>
                  {(vehicles as any[]).map((v) => <option key={v.id} value={v.id}>{v.name} (${v.daily_rate}/day)</option>)}
                </Select>
              </FieldGroup>
            </div>
            <FieldGroup label="Notes"><Textarea rows={3} value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></FieldGroup>
          </form>
        )}
      </FormDialog>

      {profile && <LeadProfileDialog lead={profile} onClose={() => setProfile(null)} />}
    </div>
  );
}

function Avatar({ name, score = 0 }: { name: string; score?: number }) {
  const hot = score >= 70;
  return (
    <div className={`relative flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${hot ? "bg-gradient-to-br from-rose-500 to-amber-500" : "bg-gradient-to-br from-cyan to-navy"}`}>
      {(name ?? "?").charAt(0).toUpperCase()}
      {hot && <Flame className="absolute -right-1 -top-1 h-3 w-3 text-amber-400 drop-shadow" />}
    </div>
  );
}

function ScoreBar({ score = 0 }: { score?: number }) {
  const s = Math.max(0, Math.min(100, Number(score) || 0));
  const color = s >= 70 ? "bg-rose-500" : s >= 40 ? "bg-amber-500" : "bg-slate-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${s}%` }} />
      </div>
      <span className="text-xs font-semibold text-navy">{s}</span>
    </div>
  );
}


/* ───────────────── PROFILE / ACTIVITY DIALOG ───────────────── */

const COMPOSER_KINDS = ["note", "call", "email", "sms", "meeting", "task"] as const;
type ComposerKind = typeof COMPOSER_KINDS[number];

const TASK_STATUSES = ["todo", "in_progress", "done", "cancelled"] as const;

function LeadProfileDialog({ lead, onClose }: { lead: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"timeline" | "tasks" | "schedule" | "convert">("timeline");
  const [kind, setKind] = useState<ComposerKind>("note");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [taskStatus, setTaskStatus] = useState<typeof TASK_STATUSES[number]>("todo");
  const [meetingMinutes, setMeetingMinutes] = useState("");
  const [participants, setParticipants] = useState("");
  const [duration, setDuration] = useState<number | "">("");

  const { data: acts = [] } = useQuery({
    queryKey: ["lead-activities", lead.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("lead_activities").select("*").eq("lead_id", lead.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: vehicle } = useQuery({
    queryKey: ["lead-vehicle", lead.vehicle_interest_id],
    enabled: !!lead.vehicle_interest_id,
    queryFn: async () => {
      const { data } = await supabase.from("vehicles").select("id, name, daily_rate, image_url").eq("id", lead.vehicle_interest_id).maybeSingle();
      return data;
    },
  });

  // Qualifying booking lookup: bookings linked to this vehicle for this lead's customer / email / phone
  const { data: qualifyingBooking } = useQuery({
    queryKey: ["lead-qualifying-booking", lead.id, lead.vehicle_interest_id],
    enabled: !!lead.vehicle_interest_id,
    queryFn: async () => {
      let q = supabase
        .from("bookings")
        .select("id, reference, status, start_date, end_date, days, total, customer_id, customers(full_name, email, phone)")
        .eq("vehicle_id", lead.vehicle_interest_id)
        .in("status", ["approved", "active", "completed"] as any)
        .order("created_at", { ascending: false })
        .limit(20);
      const { data } = await q;
      const list = (data ?? []) as any[];
      // Prefer one linked by customer_id, else match by email/phone
      const norm = (s?: string) => (s ?? "").replace(/\D/g, "");
      const match = list.find((b) =>
        (lead.customer_id && b.customer_id === lead.customer_id) ||
        (lead.email && b.customers?.email?.toLowerCase() === lead.email.toLowerCase()) ||
        (lead.phone && norm(b.customers?.phone) === norm(lead.phone))
      );
      return match ?? null;
    },
  });

  const addActivity = useMutation({
    mutationFn: async () => {
      const { data: au } = await supabase.auth.getUser();
      const payload: any = {
        lead_id: lead.id,
        kind,
        author_id: au?.user?.id ?? null,
        body: body || null,
        subject: subject || null,
      };
      if (kind === "task") {
        payload.due_at = scheduledAt || null;
        payload.status = taskStatus;
        payload.done = taskStatus === "done";
      }
      if (kind === "sms") {
        payload.scheduled_at = scheduledAt || null;
        payload.status = scheduledAt ? "scheduled" : "sent";
      }
      if (kind === "meeting") {
        payload.scheduled_at = scheduledAt || null;
        payload.meeting_minutes = meetingMinutes || null;
        payload.participants = participants ? participants.split(",").map((s) => s.trim()).filter(Boolean) : [];
        payload.duration_min = duration === "" ? null : Number(duration);
      }
      const { error } = await supabase.from("lead_activities").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead-activities", lead.id] });
      setBody(""); setSubject(""); setScheduledAt(""); setMeetingMinutes(""); setParticipants(""); setDuration("");
      setTaskStatus("todo");
      toast.success("Logged");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const advance = useMutation({
    mutationFn: async (next: Stage) => {
      const { error } = await supabase.from("leads").update({ stage: next as any }).eq("id", lead.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); qc.invalidateQueries({ queryKey: ["lead-activities", lead.id] }); toast.success("Stage updated"); },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("lead_activities").update({ status, done: status === "done" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead-activities", lead.id] }),
  });

  const readyToConvert = !!lead.vehicle_interest_id && !!qualifyingBooking;

  async function convertToCustomer() {
    if (!readyToConvert) {
      await swal.fire({
        icon: "warning",
        title: "Conversion locked",
        html: `<p class="text-sm text-left">
          A lead can be converted to a real customer <strong>only after</strong> they have:
          <br>1. Selected a vehicle of interest
          <br>2. A confirmed/active/completed booking for that vehicle
        </p>`,
        confirmButtonColor: "#0ea5b7",
      });
      return;
    }
    const { value: confirm } = await swal.fire({
      title: "Convert to customer?",
      html: `<p class="text-sm">Booking <strong>${qualifyingBooking.reference}</strong> qualifies this lead. A customer profile will be created and linked.</p>`,
      icon: "question", showCancelButton: true, confirmButtonText: "Yes, convert",
      confirmButtonColor: "#0ea5b7",
    });
    if (!confirm) return;
    try {
      let customerId = qualifyingBooking.customer_id as string | null;
      if (!customerId) {
        const { data: cust, error } = await supabase.from("customers").insert({
          full_name: lead.full_name, email: lead.email, phone: lead.phone, city: lead.city,
          source: lead.source, converted_from_lead_id: lead.id,
          approval_status: "approved", kyc_status: "pending", loyalty_tier: "bronze",
        }).select("id").single();
        if (error) throw error;
        customerId = cust!.id;
        await supabase.from("bookings").update({ customer_id: customerId }).eq("id", qualifyingBooking.id);
      }
      await supabase.from("leads").update({ customer_id: customerId, qualifying_booking_id: qualifyingBooking.id, stage: "won" as any }).eq("id", lead.id);
      await supabase.from("lead_activities").insert({ lead_id: lead.id, kind: "conversion", body: `Converted via booking ${qualifyingBooking.reference}` });
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["lead-activities", lead.id] });
      await swal.fire({
        icon: "success",
        title: "Customer created",
        html: `<p class="text-sm">${lead.full_name} is now a customer linked to booking <strong>${qualifyingBooking.reference}</strong>.</p>`,
        confirmButtonColor: "#0ea5b7",
      });
    } catch (e: any) {
      await swal.fire({ icon: "error", title: "Failed", text: e.message });
    }
  }

  const stageIndex = STAGES.indexOf(lead.stage);
  const nextStage = stageIndex >= 0 && stageIndex < STAGES.length - 2 ? STAGES[stageIndex + 1] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl bg-card shadow-2xl border border-border flex flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-border bg-gradient-to-r from-navy via-navy/95 to-cyan/30 px-6 py-5 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold backdrop-blur">
              {(lead.full_name ?? "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">{lead.full_name}</h2>
              <p className="text-xs text-white/70 flex flex-wrap items-center gap-3">
                <span>{lead.reference}</span>
                {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.phone}</span>}
                {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {lead.email}</span>}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STAGE_META[lead.stage as Stage]?.tone}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${STAGE_META[lead.stage as Stage]?.dot}`} /> {STAGE_META[lead.stage as Stage]?.label}
                </span>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">Score {lead.score}</span>
                <span className="rounded-full bg-cyan/30 px-2 py-0.5 text-[10px] font-semibold">${Number(lead.expected_value || 0).toLocaleString()}</span>
                {lead.customer_id && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/30 px-2 py-0.5 text-[10px] font-bold"><CheckCircle2 className="h-3 w-3" /> Customer</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-white/70 hover:bg-white/10"><X className="h-4 w-4" /></button>
        </div>

        {/* Stage stepper */}
        <div className="border-b border-border bg-muted/20 px-6 py-3 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {STAGES.filter((s) => s !== "lost").map((s, i, arr) => {
              const active = STAGES.indexOf(lead.stage) >= STAGES.indexOf(s);
              return (
                <div key={s} className="flex items-center">
                  <button onClick={() => advance.mutate(s)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold border transition ${active ? STAGE_META[s].tone : "border-border text-muted-foreground hover:border-cyan"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${active ? STAGE_META[s].dot : "bg-muted-foreground/40"}`} />
                    {STAGE_META[s].label}
                  </button>
                  {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/50 mx-0.5" />}
                </div>
              );
            })}
            <div className="ml-3 flex gap-1.5">
              {nextStage && <button onClick={() => advance.mutate(nextStage)} className="inline-flex items-center gap-1 rounded-md bg-cyan px-3 py-1.5 text-[11px] font-bold text-navy hover:bg-cyan/90"><ArrowRight className="h-3 w-3" /> {STAGE_META[nextStage].label}</button>}
              {lead.stage !== "lost" && lead.stage !== "won" && (
                <button onClick={() => advance.mutate("lost")} className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100">Mark lost</button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border px-6 flex gap-1">
          {[
            { id: "timeline", label: "Timeline", icon: History },
            { id: "tasks", label: "Tasks", icon: ListChecks },
            { id: "schedule", label: "Schedule", icon: CalendarClock },
            { id: "convert", label: lead.customer_id ? "Linked" : "Convert", icon: UserCheck },
          ].map((t: any) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold border-b-2 transition ${tab === t.id ? "border-cyan text-navy" : "border-transparent text-muted-foreground hover:text-navy"}`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid lg:grid-cols-[1fr_320px] gap-0">
            <div className="p-6">

              {tab === "timeline" && (
                <>
                  {/* Smart composer */}
                  <div className="mb-5 rounded-xl border border-border bg-muted/20 p-3">
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {COMPOSER_KINDS.map((k) => {
                        const m = KIND_META[k];
                        const I = m.icon;
                        const active = kind === k;
                        return (
                          <button key={k} type="button" onClick={() => setKind(k)} className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-md font-semibold transition ${active ? "bg-cyan text-navy shadow-sm" : "bg-card text-muted-foreground hover:bg-muted border border-border"}`}>
                            <I className="h-3 w-3" /> {m.label}
                          </button>
                        );
                      })}
                    </div>

                    {kind === "email" && (
                      <div className="mb-2"><Input value={subject} placeholder="Subject…" onChange={(e: any) => setSubject(e.target.value)} /></div>
                    )}
                    {kind === "task" && (
                      <div className="mb-2"><Input value={subject} placeholder="Task title…" onChange={(e: any) => setSubject(e.target.value)} /></div>
                    )}

                    <Textarea
                      rows={3}
                      placeholder={
                        kind === "note" ? "Add a quick note…"
                        : kind === "call" ? "Call summary, key points…"
                        : kind === "email" ? "Email body / what you sent…"
                        : kind === "sms" ? "SMS message text…"
                        : kind === "meeting" ? "Brief context for the meeting…"
                        : "Describe the task…"
                      }
                      value={body}
                      onChange={(e: any) => setBody(e.target.value)}
                    />

                    {kind === "meeting" && (
                      <div className="mt-2 space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="rounded-md border border-border bg-card px-2 py-1.5 text-xs" placeholder="When" />
                          <Input value={participants} onChange={(e: any) => setParticipants(e.target.value)} placeholder="Participants (comma)" />
                          <Input type="number" min={5} value={duration as any} onChange={(e: any) => setDuration(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Duration (min)" />
                        </div>
                        <Textarea rows={3} placeholder="Minutes — what was discussed, decisions, next steps…" value={meetingMinutes} onChange={(e: any) => setMeetingMinutes(e.target.value)} />
                      </div>
                    )}
                    {kind === "sms" && (
                      <div className="mt-2 flex items-center gap-2">
                        <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                        <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="rounded-md border border-border bg-card px-2 py-1.5 text-xs" />
                        <span className="text-[11px] text-muted-foreground">Leave empty to log as sent now.</span>
                      </div>
                    )}
                    {kind === "task" && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="rounded-md border border-border bg-card px-2 py-1.5 text-xs" />
                        <Select value={taskStatus} onChange={(e: any) => setTaskStatus(e.target.value)}>
                          {TASK_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.replace("_", " ")}</option>)}
                        </Select>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-end">
                      <PrimaryButton type="button" disabled={(!body.trim() && !subject.trim() && !meetingMinutes.trim()) || addActivity.isPending} onClick={() => addActivity.mutate()}>
                        <Send className="h-3.5 w-3.5" /> {kind === "task" ? "Add task" : kind === "sms" && scheduledAt ? "Schedule" : "Log activity"}
                      </PrimaryButton>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-3">
                    {(acts as any[]).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">No activity yet.</p>
                    )}
                    {(acts as any[]).map((a: any) => {
                      const meta = KIND_META[a.kind] ?? KIND_META.note;
                      const Icon = meta.icon;
                      return (
                        <div key={a.id} className="flex gap-3">
                          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.tone}`}>
                            <Icon className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="flex-1 rounded-lg border border-border bg-card p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-navy">{meta.label}</p>
                                {a.subject && <p className="text-xs text-navy font-medium">· {a.subject}</p>}
                                {a.status && <span className="text-[10px] font-semibold rounded px-1.5 py-0.5 bg-muted text-muted-foreground capitalize">{a.status.replace("_", " ")}</span>}
                              </div>
                              <p className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                            </div>
                            {a.body && <p className="mt-1 text-sm text-foreground/80 whitespace-pre-wrap">{a.body}</p>}
                            {a.kind === "meeting" && a.meeting_minutes && (
                              <div className="mt-2 rounded-md border-l-2 border-amber-400 bg-amber-50/40 px-3 py-2 text-xs text-foreground/80">
                                <p className="font-bold text-amber-800 mb-1">📋 Minutes</p>
                                <p className="whitespace-pre-wrap">{a.meeting_minutes}</p>
                                {a.participants?.length > 0 && <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground"><UsersIcon className="h-3 w-3" /> {a.participants.join(", ")}</p>}
                                {a.duration_min && <p className="text-[10px] text-muted-foreground">⏱ {a.duration_min} min</p>}
                              </div>
                            )}
                            {a.scheduled_at && (a.kind === "sms" || a.kind === "meeting") && (
                              <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1"><CalendarClock className="h-3 w-3" /> Scheduled {new Date(a.scheduled_at).toLocaleString()}</p>
                            )}
                            {a.kind === "stage_change" && a.old_stage && a.new_stage && (
                              <div className="mt-2 flex items-center gap-2 text-[11px]">
                                <Pill tone="muted">{a.old_stage}</Pill>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <Pill tone="cyan">{a.new_stage}</Pill>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {tab === "tasks" && (
                <div className="space-y-2">
                  {(acts as any[]).filter((a) => a.kind === "task").length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No tasks yet.</p>
                  )}
                  {(acts as any[]).filter((a) => a.kind === "task").map((a: any) => (
                    <div key={a.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${a.status === "done" ? "line-through text-muted-foreground" : "text-navy"}`}>{a.subject || a.body}</p>
                        {a.subject && a.body && <p className="text-xs text-foreground/70 mt-0.5">{a.body}</p>}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                          {a.due_at && <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {new Date(a.due_at).toLocaleString()}</span>}
                          <Select value={a.status ?? "todo"} onChange={(e: any) => updateTask.mutate({ id: a.id, status: e.target.value })}>
                            {TASK_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.replace("_", " ")}</option>)}
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === "schedule" && (
                <div className="space-y-3">
                  {(() => {
                    const upcoming = (acts as any[])
                      .filter((a) => a.scheduled_at || a.due_at)
                      .map((a) => ({ ...a, when: a.scheduled_at || a.due_at }))
                      .filter((a) => new Date(a.when).getTime() >= Date.now() - 86400000)
                      .sort((x, y) => new Date(x.when).getTime() - new Date(y.when).getTime());
                    if (upcoming.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">Nothing scheduled.</p>;
                    return upcoming.map((a) => {
                      const m = KIND_META[a.kind] ?? KIND_META.note;
                      const I = m.icon;
                      return (
                        <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-md ${m.tone}`}><I className="h-4 w-4 text-white" /></div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-navy">{a.subject || a.body || m.label}</p>
                            <p className="text-[11px] text-muted-foreground">{new Date(a.when).toLocaleString()}</p>
                          </div>
                          {a.status && <Pill tone="muted">{a.status}</Pill>}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {tab === "convert" && (
                <div className="space-y-4">
                  <div className="rounded-xl border-2 border-dashed border-cyan/40 bg-cyan/5 p-5">
                    <h3 className="font-display text-lg font-bold text-navy flex items-center gap-2"><UserCheck className="h-5 w-5 text-cyan" /> Conversion checklist</h3>
                    <p className="mt-1 text-xs text-muted-foreground">A lead becomes a real customer only after they pick a vehicle <strong>and</strong> actually rent it.</p>

                    <ul className="mt-4 space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        {lead.vehicle_interest_id
                          ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          : <AlertTriangle className="h-5 w-5 text-amber-500" />}
                        <span>
                          <strong>Vehicle selected</strong>
                          {vehicle && <span className="ml-2 text-muted-foreground">— {vehicle.name} (${vehicle.daily_rate}/day)</span>}
                          {!lead.vehicle_interest_id && <span className="ml-2 text-muted-foreground">— Edit lead to pick one</span>}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        {qualifyingBooking
                          ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          : <AlertTriangle className="h-5 w-5 text-amber-500" />}
                        <span>
                          <strong>Booking confirmed</strong>
                          {qualifyingBooking
                            ? <span className="ml-2 text-muted-foreground">— {qualifyingBooking.reference} · {qualifyingBooking.status} · ${qualifyingBooking.total}</span>
                            : <span className="ml-2 text-muted-foreground">— No booking found for this lead's contact on the selected vehicle</span>}
                        </span>
                      </li>
                    </ul>
                  </div>

                  {lead.customer_id ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="font-bold text-emerald-800 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Already a customer</p>
                      <p className="mt-1 text-sm text-emerald-700">Linked customer record. View it from the Customers page.</p>
                    </div>
                  ) : (
                    <button
                      onClick={convertToCustomer}
                      disabled={!readyToConvert}
                      className={`w-full inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-bold transition ${readyToConvert ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow hover:from-emerald-600 hover:to-emerald-700" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
                    >
                      <UserCheck className="h-4 w-4" />
                      {readyToConvert ? "Convert to customer now" : "Complete checklist to convert"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Side info */}
            <aside className="border-l border-border bg-muted/20 p-5 space-y-4 text-sm">
              {vehicle && (
                <div className="rounded-lg border border-cyan/30 bg-cyan/5 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-cyan mb-2 flex items-center gap-1"><Car className="h-3 w-3" /> Interested in</p>
                  {vehicle.image_url && <img src={vehicle.image_url} alt="" className="w-full h-24 object-cover rounded-md mb-2" />}
                  <p className="font-bold text-navy">{vehicle.name}</p>
                  <p className="text-xs text-muted-foreground">${vehicle.daily_rate}/day</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Lead details</p>
                <Row k="Source" v={lead.source?.replace("_"," ")} />
                <Row k="City" v={lead.city ?? "—"} />
                <Row k="Created" v={new Date(lead.created_at).toLocaleDateString()} />
                <Row k="Expected close" v={lead.expected_close_date ?? "—"} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Notes</p>
                <p className="text-xs text-foreground/80 whitespace-pre-wrap">{lead.notes || "—"}</p>
              </div>
              <div className="rounded-md border border-border bg-card p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1"><ClipboardList className="h-3 w-3" /> Quick stats</p>
                <Row k="Activities" v={(acts as any[]).length} />
                <Row k="Open tasks" v={(acts as any[]).filter((a) => a.kind === "task" && a.status !== "done" && a.status !== "cancelled").length} />
                <Row k="Scheduled" v={(acts as any[]).filter((a) => a.scheduled_at && new Date(a.scheduled_at).getTime() > Date.now()).length} />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex justify-between gap-3 py-1 text-xs">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-semibold text-navy text-right capitalize">{v}</span>
    </div>
  );
}
