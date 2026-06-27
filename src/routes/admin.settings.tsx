import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Save, Building2, Phone, Share2, Clock, Calculator, RotateCcw, FileText, CalendarCheck, Globe } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/ui";
import { FieldGroup, Input, Textarea, PrimaryButton } from "@/components/admin/FormDialog";
import { SETTING_DEFAULTS, type SettingsMap } from "@/lib/use-settings";

export const Route = createFileRoute("/admin/settings")({ component: SettingsAdmin });

type TabKey = keyof SettingsMap;
const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "company", label: "Company", icon: Building2 },
  { key: "contact", label: "Contact", icon: Phone },
  { key: "social", label: "Social", icon: Share2 },
  { key: "hours", label: "Hours", icon: Clock },
  { key: "financial", label: "Financial", icon: Calculator },
  { key: "refundPolicy", label: "Refund policy", icon: RotateCcw },
  { key: "footer", label: "Footer", icon: FileText },
  { key: "booking", label: "Booking rules", icon: CalendarCheck },
  { key: "seo", label: "SEO", icon: Globe },
];

function SettingsAdmin() {
  const [tab, setTab] = useState<TabKey>("company");
  return (
    <div>
      <PageHeader title="Settings" subtitle="Everything the website, admin and PDFs read from — saved instantly to the database." />
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-1 rounded-2xl border border-border bg-card p-2 shadow-card h-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                tab === t.key ? "bg-cyan/10 font-semibold text-cyan" : "text-navy hover:bg-muted"
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </nav>
        <SettingEditor tab={tab} />
      </div>
    </div>
  );
}

function SettingEditor({ tab }: { tab: TabKey }) {
  const qc = useQueryClient();
  const defaults = SETTING_DEFAULTS[tab] as any;

  const { data, isLoading } = useQuery({
    queryKey: ["settings", tab],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("value").eq("key", tab).maybeSingle();
      if (error) throw error;
      return (data?.value as any) ?? null;
    },
  });

  const [form, setForm] = useState<any>(defaults);
  useEffect(() => { setForm({ ...defaults, ...(data ?? {}) }); }, [data, tab]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("app_settings").upsert({ key: tab, value: form, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings", tab] });
      qc.invalidateQueries({ queryKey: ["app_settings"] });
      toast.success("Settings saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
      className="rounded-2xl border border-border bg-card p-6 shadow-card"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {Object.keys(defaults).map((k) => {
          const v = form[k];
          const dv = defaults[k];
          const isArr = Array.isArray(dv);
          const isBool = typeof dv === "boolean";
          const isNum = typeof dv === "number";
          const isLong = typeof dv === "string" && (k.toLowerCase().includes("address") || k.toLowerCase().includes("notes") || k.toLowerCase().includes("description") || k === "mapUrl");
          const wide = isLong || isArr;
          return (
            <div key={k} className={wide ? "sm:col-span-2" : ""}>
              <FieldGroup label={prettyLabel(k)}>
                {isBool ? (
                  <select
                    value={v ? "1" : "0"}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value === "1" })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
                  >
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                  </select>
                ) : isArr ? (
                  <Textarea
                    value={(v ?? []).join("\n")}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
                    rows={4}
                    placeholder="One per line"
                  />
                ) : isLong ? (
                  <Textarea value={v ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} rows={3} />
                ) : (
                  <Input
                    type={isNum ? "number" : "text"}
                    step={isNum ? "any" : undefined}
                    value={v ?? ""}
                    onChange={(e) => setForm({ ...form, [k]: isNum ? Number(e.target.value) : e.target.value })}
                  />
                )}
              </FieldGroup>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex justify-end">
        <PrimaryButton disabled={save.isPending} type="submit">
          <Save className="h-4 w-4" /> {save.isPending ? "Saving…" : "Save changes"}
        </PrimaryButton>
      </div>
    </form>
  );
}

function prettyLabel(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}