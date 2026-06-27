import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Megaphone, Plus, Search, Pencil, Trash2, Eye, Calendar, Target, TrendingUp,
  DollarSign, Activity, Pause, Play, Wand2, Globe, MapPin, Mail, MessageSquare, Radio,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Pill, StatCard, TableShell, EmptyState } from "@/components/admin/ui";
import { FormDialog, FieldGroup, Input, Select, Textarea, PrimaryButton, GhostButton } from "@/components/admin/FormDialog";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { confirmDelete, notifyDeleted, notifyError } from "@/lib/swal";

export const Route = createFileRoute("/admin/crm/campaigns")({ component: CampaignsAdmin });

const DIGITAL_CHANNELS = ["Facebook", "Instagram", "TikTok", "Google Ads", "Email", "WhatsApp", "SMS", "YouTube"];
const PHYSICAL_CHANNELS = ["Billboard", "Radio", "TV", "Newspaper", "Flyer", "Event", "Partnership", "In-store"];
const OBJECTIVES = ["Brand awareness", "Lead generation", "Direct conversion", "Customer retention", "Re-engagement"];

const LANDING_TEMPLATES = [
  { id: "classic", label: "Classic", desc: "Hero + features + footer. Trustworthy default." },
  { id: "bold", label: "Bold", desc: "Full-bleed image with brutalist typography." },
  { id: "minimal", label: "Minimal", desc: "Editorial. Pure typography. Long-form." },
];

const empty = {
  type: "digital", status: "draft", name: "", channel: "", objective: "Lead generation",
  audience: "", headline: "", body: "", call_to_action: "Book now", creative_url: "",
  landing_url: "", start_date: "", end_date: "", budget: 0, spend: 0, tags: [] as string[],
  landing_template: "classic", landing_published: false,
};

function CampaignsAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [viewing, setViewing] = useState<any | null>(null);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "digital" | "physical">("all");

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (c: any) => {
      const p: any = { ...c };
      delete p.id; delete p.created_at; delete p.updated_at; delete p.landing_slug;
      p.budget = Number(p.budget) || 0;
      p.start_date = p.start_date || null;
      p.end_date = p.end_date || null;
      if (c.id) {
        const { error } = await supabase.from("campaigns").update(p).eq("id", c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("campaigns").insert(p);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns"] }); setEditing(null); toast.success("Campaign saved"); },
    onError: (e: any) => {
      if (String(e.message).includes("campaigns_one_active_digital_uidx")) {
        toast.error("Only one active digital campaign can exist. Pause the current one first.");
      } else {
        toast.error(e.message);
      }
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("campaigns").update({ status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns"] }); toast.success("Status updated"); },
    onError: (e: any) => {
      if (String(e.message).includes("campaigns_one_active_digital_uidx")) {
        toast.error("Another digital campaign is already active. Pause it first.");
      } else {
        toast.error(e.message);
      }
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, on }: { id: string; on: boolean }) => {
      const { error } = await supabase.from("campaigns").update({ landing_published: on }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns"] }); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
    onError: (e: any) => notifyError(e.message),
  });

  async function handleDelete(c: any) {
    const ok = await confirmDelete({ itemLabel: c.name, description: "Linked leads will lose their campaign attribution." });
    if (!ok) return;
    await del.mutateAsync(c.id);
    await notifyDeleted(c.name);
  }

  const filtered = useMemo(() => {
    return (campaigns as any[]).filter((c) =>
      (typeFilter === "all" || c.type === typeFilter) &&
      (!q || (c.name + " " + (c.channel ?? "") + " " + (c.headline ?? "")).toLowerCase().includes(q.toLowerCase()))
    );
  }, [campaigns, q, typeFilter]);

  const stats = useMemo(() => {
    const c = campaigns as any[];
    return {
      total: c.length,
      active: c.filter((x) => x.status === "active").length,
      budget: c.reduce((s, x) => s + Number(x.budget || 0), 0),
      conv: c.reduce((s, x) => s + Number(x.conversions || 0), 0),
    };
  }, [campaigns]);

  return (
    <div>
      <PageHeader
        title="Campaigns"
        subtitle="Plan, launch and track physical & digital marketing campaigns"
        actions={<PrimaryButton onClick={() => setEditing({ ...empty })}><Plus className="h-4 w-4" /> New campaign</PrimaryButton>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total campaigns" value={stats.total} icon={Megaphone} tone="cyan" />
        <StatCard label="Active now" value={stats.active} icon={Activity} tone="emerald" />
        <StatCard label="Total budget" value={`$${stats.budget.toLocaleString()}`} icon={DollarSign} tone="amber" />
        <StatCard label="Conversions" value={stats.conv} icon={TrendingUp} tone="cyan" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 max-w-sm flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search campaign…" className="w-full bg-transparent text-sm outline-none" />
        </div>
        <div className="flex rounded-md border border-border bg-card overflow-hidden">
          {["all","digital","physical"].map((t) => (
            <button key={t} onClick={() => setTypeFilter(t as any)}
              className={`px-3 py-2 text-xs font-semibold capitalize ${typeFilter === t ? "bg-cyan text-navy" : "text-muted-foreground hover:bg-muted/50"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Megaphone} title="No campaigns yet" body="Launch your first marketing campaign to attract leads."
          action={<PrimaryButton onClick={() => setEditing({ ...empty })}><Plus className="h-4 w-4" /> Create campaign</PrimaryButton>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c: any) => (
            <article key={c.id} className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:shadow-xl hover:-translate-y-0.5">
              <div className="relative h-32 overflow-hidden bg-gradient-to-br from-navy via-navy/90 to-cyan/40">
                {c.creative_url && <img src={c.creative_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/90 to-transparent" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur ${c.type === "digital" ? "bg-cyan/90 text-navy" : "bg-amber-400/90 text-navy"}`}>
                    {c.type === "digital" ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />} {c.type}
                  </span>
                  <Pill tone={c.status === "active" ? "green" : c.status === "paused" ? "amber" : c.status === "completed" ? "blue" : "muted"}>{c.status}</Pill>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-display text-lg font-bold text-white truncate">{c.name}</h3>
                  {c.headline && <p className="text-xs text-white/80 truncate">{c.headline}</p>}
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {channelIcon(c.channel)} <span className="font-semibold text-navy">{c.channel || "—"}</span>
                  <span className="ml-auto">{c.start_date ?? "—"} → {c.end_date ?? "—"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Mini label="Budget" value={`$${Number(c.budget || 0).toLocaleString()}`} />
                  <Mini label="Spend" value={`$${Number(c.spend || 0).toLocaleString()}`} />
                  <Mini label="Conv." value={c.conversions ?? 0} />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button onClick={() => setViewing(c)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:border-cyan hover:text-cyan transition"><Eye className="h-3.5 w-3.5" /> Preview</button>
                  <button onClick={() => setEditing(c)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:border-cyan hover:text-cyan transition"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                  {c.landing_slug && (
                    <a href={`/c/${c.landing_slug}`} target="_blank" rel="noreferrer"
                       className="inline-flex items-center gap-1 rounded-md border border-cyan/50 bg-cyan/10 px-2 py-1 text-xs text-cyan hover:bg-cyan/20"><Globe className="h-3.5 w-3.5" /> Landing</a>
                  )}
                  {c.landing_slug && (
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/c/${c.landing_slug}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Landing URL copied");
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:border-cyan hover:text-cyan transition">📋 Copy URL</button>
                  )}
                  <button
                    onClick={() => togglePublish.mutate({ id: c.id, on: !c.landing_published })}
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition ${
                      c.landing_published ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-border text-muted-foreground hover:border-cyan"
                    }`}>{c.landing_published ? "● Published" : "○ Unpublished"}</button>
                  {c.status === "active"
                    ? <button onClick={() => setStatus.mutate({ id: c.id, status: "paused" })} className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700 hover:bg-amber-100"><Pause className="h-3.5 w-3.5" /> Pause</button>
                    : <button onClick={() => setStatus.mutate({ id: c.id, status: "active" })} className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100"><Play className="h-3.5 w-3.5" /> Launch</button>}
                  <button onClick={() => handleDelete(c)} className="ml-auto inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Preview */}
      <FormDialog
        open={!!viewing}
        onClose={() => setViewing(null)}
        title="Creative preview"
        subtitle={viewing?.name}
        size="lg"
        footer={<GhostButton onClick={() => setViewing(null)}>Close</GhostButton>}
      >
        {viewing && <CampaignPreview c={viewing} />}
      </FormDialog>

      {/* Editor */}
      <FormDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit campaign" : "New campaign"}
        subtitle="Design the message, audience and reach"
        size="xl"
        footer={<>
          <GhostButton onClick={() => setEditing(null)}>Cancel</GhostButton>
          <PrimaryButton form="campaign-form" type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save campaign"}</PrimaryButton>
        </>}
      >
        {editing && (
          <form id="campaign-form" onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }} className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-gradient-to-br from-cyan/5 to-transparent p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-cyan mb-2">Type & objective</p>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Campaign type" required>
                    <Select required value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value, channel: "" })}>
                      <option value="digital">📱 Digital</option>
                      <option value="physical">🏷️ Physical</option>
                    </Select>
                  </FieldGroup>
                  <FieldGroup label="Status">
                    <Select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </Select>
                  </FieldGroup>
                  <FieldGroup label="Channel">
                    <Select value={editing.channel ?? ""} onChange={(e) => setEditing({ ...editing, channel: e.target.value })}>
                      <option value="">Select channel…</option>
                      {(editing.type === "digital" ? DIGITAL_CHANNELS : PHYSICAL_CHANNELS).map((ch) => <option key={ch} value={ch}>{ch}</option>)}
                    </Select>
                  </FieldGroup>
                  <FieldGroup label="Objective">
                    <Select value={editing.objective ?? ""} onChange={(e) => setEditing({ ...editing, objective: e.target.value })}>
                      {OBJECTIVES.map((o) => <option key={o}>{o}</option>)}
                    </Select>
                  </FieldGroup>
                </div>
              </div>

              <FieldGroup label="Campaign name" required>
                <Input required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Eid Weekend Promo 2026" />
              </FieldGroup>

              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-cyan flex items-center gap-1"><Wand2 className="h-3 w-3" /> Creative content</p>
                <FieldGroup label="Headline" hint="Short and bold — max 60 chars">
                  <Input maxLength={80} value={editing.headline ?? ""} onChange={(e) => setEditing({ ...editing, headline: e.target.value })} placeholder="Drive the city in style — 20% off" />
                </FieldGroup>
                <FieldGroup label="Message / body copy">
                  <Textarea rows={4} value={editing.body ?? ""} onChange={(e) => setEditing({ ...editing, body: e.target.value })} placeholder="Tell your audience why this offer matters and what makes it special…" />
                </FieldGroup>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Call to action">
                    <Input value={editing.call_to_action ?? ""} onChange={(e) => setEditing({ ...editing, call_to_action: e.target.value })} placeholder="Book now" />
                  </FieldGroup>
                  <FieldGroup label="Landing URL">
                    <Input type="url" value={editing.landing_url ?? ""} onChange={(e) => setEditing({ ...editing, landing_url: e.target.value })} placeholder="https://…" />
                  </FieldGroup>
                </div>
                <FieldGroup label="Target audience">
                  <Textarea rows={2} value={editing.audience ?? ""} onChange={(e) => setEditing({ ...editing, audience: e.target.value })} placeholder="e.g. Adults 25–45 in Hargeisa, frequent travellers, business owners" />
                </FieldGroup>
              </div>
            </div>

            <div className="space-y-4">
              <ImageUploader value={editing.creative_url} onChange={(url) => setEditing({ ...editing, creative_url: url })} folder="campaigns" label="Creative image" aspect="video" />
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-cyan">Schedule & budget</p>
                <FieldGroup label="Start date"><Input type="date" value={editing.start_date ?? ""} onChange={(e) => setEditing({ ...editing, start_date: e.target.value })} /></FieldGroup>
                <FieldGroup label="End date"><Input type="date" value={editing.end_date ?? ""} onChange={(e) => setEditing({ ...editing, end_date: e.target.value })} /></FieldGroup>
                <FieldGroup label="Budget ($)"><Input type="number" min={0} step={0.01} value={editing.budget ?? 0} onChange={(e) => setEditing({ ...editing, budget: e.target.value })} /></FieldGroup>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-cyan flex items-center gap-1"><Globe className="h-3 w-3" /> Landing page</p>
                <FieldGroup label="Template">
                  <div className="grid grid-cols-3 gap-2">
                    {LANDING_TEMPLATES.map((t) => (
                      <button key={t.id} type="button"
                        onClick={() => setEditing({ ...editing, landing_template: t.id })}
                        className={`rounded-md border p-2 text-left text-xs transition ${editing.landing_template === t.id ? "border-cyan bg-cyan/10 text-navy" : "border-border hover:border-cyan"}`}>
                        <p className="font-bold">{t.label}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </FieldGroup>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={!!editing.landing_published} onChange={(e) => setEditing({ ...editing, landing_published: e.target.checked })} className="h-4 w-4 accent-cyan" />
                  <span>Publish landing page (visible at <code>/c/{editing.landing_slug || "auto-slug"}</code>)</span>
                </label>
                {editing.type === "digital" && (
                  <p className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-800">
                    ⚠ Only <strong>one digital campaign</strong> can be Active at a time. Physical campaigns have no limit.
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-dashed border-cyan/40 bg-cyan/5 p-4 text-xs">
                <p className="font-semibold text-navy mb-1 flex items-center gap-1"><Target className="h-3.5 w-3.5 text-cyan" /> Pro tip</p>
                <p className="text-muted-foreground">Tie campaigns to leads from the Leads board to track real ROI.</p>
              </div>
            </div>
          </form>
        )}
      </FormDialog>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-md bg-muted/40 px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-navy">{value}</p>
    </div>
  );
}

function channelIcon(ch?: string) {
  const c = (ch || "").toLowerCase();
  if (c.includes("mail")) return <Mail className="h-3.5 w-3.5 text-cyan" />;
  if (c.includes("sms") || c.includes("whats")) return <MessageSquare className="h-3.5 w-3.5 text-cyan" />;
  if (c.includes("radio") || c.includes("tv")) return <Radio className="h-3.5 w-3.5 text-cyan" />;
  if (c.includes("billboard") || c.includes("event") || c.includes("store")) return <MapPin className="h-3.5 w-3.5 text-cyan" />;
  return <Globe className="h-3.5 w-3.5 text-cyan" />;
}

function CampaignPreview({ c }: { c: any }) {
  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy/95 to-cyan/30 p-8 text-white shadow-2xl min-h-[280px]">
        {c.creative_url && <img src={c.creative_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />}
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
        <div className="relative">
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-navy">{c.channel || c.type}</span>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight">{c.headline || c.name}</h2>
          {c.body && <p className="mt-2 text-sm text-white/90 max-w-lg">{c.body}</p>}
          {c.call_to_action && (
            <button className="mt-5 inline-flex items-center gap-2 rounded-md bg-cyan px-5 py-2.5 text-sm font-bold text-navy hover:bg-cyan/90 transition">
              {c.call_to_action} →
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Info label="Audience" value={c.audience || "—"} />
        <Info label="Objective" value={c.objective || "—"} />
        <Info label="Period" value={`${c.start_date ?? "—"} → ${c.end_date ?? "—"}`} icon={Calendar} />
        <Info label="Budget" value={`$${Number(c.budget || 0).toLocaleString()}`} icon={DollarSign} />
      </div>
    </div>
  );
}

function Info({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">{Icon && <Icon className="h-3 w-3" />} {label}</p>
      <p className="mt-1 text-sm font-semibold text-navy">{value}</p>
    </div>
  );
}