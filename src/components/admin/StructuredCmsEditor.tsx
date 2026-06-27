import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, GripVertical, Plus, Save, Trash2, Undo2, Eye, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "./ui";
import type { FieldDef, SectionDef } from "@/lib/cms/schema";
import { deepMerge } from "@/lib/cms/defaults";

type Props = {
  slug: "home" | "about" | "fleet";
  label: string;
  defaultTitle: string;
  schema: SectionDef[];
  defaults: any;
  previewPath: string;
};

export function StructuredCmsEditor({ slug, label, defaultTitle, schema, defaults, previewPath }: Props) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-cms", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("cms_pages").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const merged = useMemo(() => deepMerge(defaults, data?.sections ?? {}), [defaults, data]);
  const [title, setTitle] = useState(defaultTitle);
  const [content, setContent] = useState<any>(merged);
  const [openSection, setOpenSection] = useState<string | null>(schema[0]?.key ?? null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setContent(merged);
    setTitle(data?.title || defaultTitle);
    setDirty(false);
  }, [data]); // eslint-disable-line

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("cms_pages")
        .upsert({ slug, title, sections: content, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cms", slug] });
      qc.invalidateQueries({ queryKey: ["cms", slug] });
      toast.success("Page published");
      setDirty(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateSection = (sectionKey: string, value: any) => {
    setContent((c: any) => ({ ...c, [sectionKey]: value }));
    setDirty(true);
  };
  const resetSection = (sectionKey: string) => {
    setContent((c: any) => ({ ...c, [sectionKey]: defaults[sectionKey] }));
    setDirty(true);
    toast.info("Section reset to defaults");
  };
  const resetAll = () => {
    setContent(defaults);
    setDirty(true);
    toast.info("All sections reset to defaults");
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading editor…</div>;

  return (
    <div>
      <PageHeader
        title={`Website CMS · ${label}`}
        subtitle="Edit any text on the public site. Changes go live the moment you publish."
        actions={
          <>
            <Link to={previewPath as any} target="_blank" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:border-cyan">
              <Eye className="h-4 w-4" /> View live <ExternalLink className="h-3 w-3" />
            </Link>
            <button onClick={resetAll} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:border-rose-300 hover:text-rose-700">
              <Undo2 className="h-4 w-4" /> Reset all
            </button>
            <button
              disabled={save.isPending || !dirty}
              onClick={() => save.mutate()}
              className="inline-flex items-center gap-2 rounded-md bg-gradient-cyan px-4 py-2 text-sm font-semibold text-white shadow-card disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {save.isPending ? "Publishing…" : dirty ? "Publish changes" : "Saved"}
            </button>
          </>
        }
      />

      {/* Top meta + status */}
      <div className="mb-6 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-card md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Page title (SEO)</label>
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${dirty ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dirty ? "bg-amber-500" : "bg-emerald-500"}`} />
            {dirty ? "Unpublished changes" : "Up to date"}
          </span>
          {data?.updated_at && (
            <span className="text-xs text-muted-foreground">
              Last updated {new Date(data.updated_at).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Section list */}
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Sections</p>
          <nav className="space-y-1">
            {schema.map((s) => {
              const Icon = s.icon;
              const active = openSection === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setOpenSection(s.key)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${active ? "bg-navy text-white shadow-card" : "text-foreground hover:bg-muted"}`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-cyan" : "text-cyan/80"}`} />
                  <span className="flex-1">{s.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="mt-4 rounded-xl border border-cyan/20 bg-cyan/5 p-3 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5 font-semibold text-navy"><Sparkles className="h-3.5 w-3.5 text-cyan" /> Tip</p>
            <p className="mt-1">Click <strong>Publish changes</strong> when you're done — your edits go live instantly on the public website.</p>
          </div>
        </aside>

        {/* main editor */}
        <div className="space-y-4">
          {schema.map((s) => (
            openSection === s.key && (
              <SectionEditor
                key={s.key}
                section={s}
                value={content[s.key]}
                onChange={(v) => updateSection(s.key, v)}
                onReset={() => resetSection(s.key)}
              />
            )
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionEditor({ section, value, onChange, onReset }: { section: SectionDef; value: any; onChange: (v: any) => void; onReset: () => void }) {
  const Icon = section.icon;
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-muted/40 to-transparent px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-cyan text-white shadow-card">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-navy">{section.label}</p>
            {section.description && <p className="text-xs text-muted-foreground">{section.description}</p>}
          </div>
        </div>
        <button onClick={onReset} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-rose-700">
          <Undo2 className="h-3 w-3" /> Reset
        </button>
      </div>
      <div className="space-y-5 p-5">
        {section.fields.map((f) => (
          <FieldRenderer key={f.key} field={f} value={value} onChange={onChange} />
        ))}
      </div>
    </div>
  );
}

function FieldRenderer({ field, value, onChange }: { field: FieldDef; value: any; onChange: (v: any) => void }) {
  // Special "_root" key means the field itself replaces the whole section
  const get = (k: string) => (k === "_root" ? value : value?.[k]);
  const set = (k: string, v: any) => (k === "_root" ? onChange(v) : onChange({ ...(value || {}), [k]: v }));

  switch (field.kind) {
    case "text":
      return (
        <FieldShell label={field.label}>
          <input value={get(field.key) ?? ""} onChange={(e) => set(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-cyan focus:outline-none" />
        </FieldShell>
      );
    case "textarea":
      return (
        <FieldShell label={field.label}>
          <textarea value={get(field.key) ?? ""} onChange={(e) => set(field.key, e.target.value)}
            rows={field.rows ?? 3} placeholder={field.placeholder}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed focus:border-cyan focus:outline-none" />
        </FieldShell>
      );
    case "number":
      return (
        <FieldShell label={field.label}>
          <input type="number" value={get(field.key) ?? 0}
            onChange={(e) => set(field.key, Number(e.target.value))}
            className="w-40 rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-cyan focus:outline-none" />
        </FieldShell>
      );
    case "object":
      return (
        <FieldShell label={field.label}>
          <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-2">
            {field.fields.map((sub) => (
              <FieldRenderer key={sub.key} field={sub}
                value={get(field.key) || {}}
                onChange={(v) => set(field.key, v)} />
            ))}
          </div>
        </FieldShell>
      );
    case "stringList":
      return <StringListEditor field={field} value={get(field.key)} onChange={(v) => set(field.key, v)} />;
    case "list":
      return <ListEditor field={field} value={get(field.key)} onChange={(v) => set(field.key, v)} />;
  }
}

function FieldShell({ label, children }: { label: string; children: any }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function StringListEditor({ field, value, onChange }: { field: any; value: string[] | undefined; onChange: (v: string[]) => void }) {
  const list = value ?? [];
  const update = (i: number, v: string) => onChange(list.map((x, idx) => idx === i ? v : x));
  const remove = (i: number) => onChange(list.filter((_, idx) => idx !== i));
  const add = () => onChange([...list, ""]);
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= list.length) return;
    const c = [...list]; [c[i], c[j]] = [c[j], c[i]]; onChange(c);
  };
  return (
    <FieldShell label={field.label}>
      <div className="space-y-2">
        {list.map((v, i) => (
          <div key={i} className="flex items-center gap-2 rounded-md border border-border bg-background p-1.5">
            <span className="grid h-7 w-7 place-items-center text-muted-foreground"><GripVertical className="h-3.5 w-3.5" /></span>
            <input value={v} onChange={(e) => update(i, e.target.value)}
              className="flex-1 rounded-md bg-transparent px-2 py-1 text-sm focus:outline-none" />
            <button onClick={() => move(i, -1)} className="rounded p-1 text-muted-foreground hover:bg-muted" title="Move up"><ChevronUp className="h-3.5 w-3.5" /></button>
            <button onClick={() => move(i, 1)} className="rounded p-1 text-muted-foreground hover:bg-muted" title="Move down"><ChevronDown className="h-3.5 w-3.5" /></button>
            <button onClick={() => remove(i)} className="rounded p-1 text-rose-600 hover:bg-rose-50" title="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <button onClick={add} className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-cyan hover:text-cyan">
          <Plus className="h-3.5 w-3.5" /> Add {field.itemLabel.toLowerCase()}
        </button>
      </div>
    </FieldShell>
  );
}

function ListEditor({ field, value, onChange }: { field: any; value: any[] | undefined; onChange: (v: any[]) => void }) {
  const list = value ?? [];
  const update = (i: number, v: any) => onChange(list.map((x, idx) => idx === i ? v : x));
  const remove = (i: number) => onChange(list.filter((_, idx) => idx !== i));
  const add = () => {
    const blank: any = {};
    field.itemFields.forEach((f: FieldDef) => {
      blank[(f as any).key] = f.kind === "number" ? 0 : f.kind === "stringList" ? [] : f.kind === "list" ? [] : "";
    });
    onChange([...list, blank]);
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= list.length) return;
    const c = [...list]; [c[i], c[j]] = [c[j], c[i]]; onChange(c);
  };
  const canAdd = field.max ? list.length < field.max : true;

  return (
    <FieldShell label={`${field.label}${field.max ? ` (max ${field.max})` : ""}`}>
      <div className="space-y-3">
        {list.map((item, i) => (
          <details key={i} open className="rounded-xl border border-border bg-muted/30">
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm font-semibold text-navy [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2"><GripVertical className="h-3.5 w-3.5 text-muted-foreground" /> {field.itemLabel} #{i + 1} {item?.title || item?.name || item?.q ? <span className="text-xs font-normal text-muted-foreground">— {item.title || item.name || item.q}</span> : null}</span>
              <span className="flex items-center gap-1">
                <button onClick={(e) => { e.preventDefault(); move(i, -1); }} className="rounded p-1 text-muted-foreground hover:bg-muted"><ChevronUp className="h-3.5 w-3.5" /></button>
                <button onClick={(e) => { e.preventDefault(); move(i, 1); }} className="rounded p-1 text-muted-foreground hover:bg-muted"><ChevronDown className="h-3.5 w-3.5" /></button>
                <button onClick={(e) => { e.preventDefault(); remove(i); }} className="rounded p-1 text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /></button>
              </span>
            </summary>
            <div className="space-y-3 border-t border-border bg-background p-3">
              {field.itemFields.map((sub: FieldDef) => (
                <FieldRenderer key={(sub as any).key} field={sub} value={item} onChange={(v) => update(i, v)} />
              ))}
            </div>
          </details>
        ))}
        {canAdd && (
          <button onClick={add} className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-cyan hover:text-cyan">
            <Plus className="h-3.5 w-3.5" /> Add {field.itemLabel.toLowerCase()}
          </button>
        )}
      </div>
    </FieldShell>
  );
}