import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Quote, PlayCircle, Award, Newspaper, Search, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Pill, TableShell, EmptyState } from "@/components/admin/ui";
import { FormDialog, FieldGroup, Input, Select, Textarea, PrimaryButton, GhostButton } from "@/components/admin/FormDialog";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { GripVertical, X as XIcon, Plus as PlusIcon } from "lucide-react";

export const Route = createFileRoute("/admin/news")({ component: AdminNews });

type Post = {
  id: string;
  category: "testimonial" | "video" | "award" | "news";
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  body: string | null;
  cover_url: string | null;
  video_url: string | null;
  customer_name: string | null;
  customer_title: string | null;
  customer_company: string | null;
  rating: number | null;
  award_issuer: string | null;
  event_date: string | null;
  tags: string[];
  featured: boolean;
  published: boolean;
  published_at: string;
  sort_order: number;
  gallery: string[];
};

const empty: Partial<Post> = {
  category: "testimonial",
  slug: "",
  title: "",
  subtitle: "",
  excerpt: "",
  body: "",
  cover_url: "",
  video_url: "",
  customer_name: "",
  customer_title: "",
  customer_company: "",
  rating: 5,
  award_issuer: "",
  event_date: "",
  tags: [],
  featured: false,
  published: true,
  sort_order: 0,
  gallery: [],
};

function AdminNews() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [editing, setEditing] = useState<Partial<Post> | null>(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-news"],
    queryFn: async () => {
      const { data, error } = await supabase.from("news_posts").select("*").order("featured", { ascending: false }).order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Post[];
    },
  });

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (q && !`${p.title} ${p.customer_name ?? ""} ${p.award_issuer ?? ""} ${p.slug}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [posts, q, cat]);

  const save = useMutation({
    mutationFn: async (p: Partial<Post>) => {
      const payload: any = {
        category: p.category,
        slug: (p.slug || slugify(p.title || "")).trim(),
        title: p.title,
        subtitle: p.subtitle || null,
        excerpt: p.excerpt || null,
        body: p.body || null,
        cover_url: p.cover_url || null,
        video_url: p.video_url || null,
        customer_name: p.customer_name || null,
        customer_title: p.customer_title || null,
        customer_company: p.customer_company || null,
        rating: p.rating || null,
        award_issuer: p.award_issuer || null,
        event_date: p.event_date || null,
        tags: Array.isArray(p.tags) ? p.tags : (typeof p.tags === "string" ? (p.tags as any).split(",").map((s: string) => s.trim()).filter(Boolean) : []),
        featured: !!p.featured,
        published: !!p.published,
        sort_order: Number(p.sort_order ?? 0),
        gallery: Array.isArray(p.gallery) ? p.gallery.filter(Boolean) : [],
      };
      if (!payload.title || !payload.slug) throw new Error("Title and slug are required");
      if (p.id) {
        const { error } = await supabase.from("news_posts").update(payload).eq("id", p.id);
        if (error) throw error;
      } else {
        payload.published_at = new Date().toISOString();
        const { error } = await supabase.from("news_posts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-news"] });
      qc.invalidateQueries({ queryKey: ["news"] });
      toast.success("Saved");
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-news"] });
      qc.invalidateQueries({ queryKey: ["news"] });
      toast.success("Deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const togglePublish = useMutation({
    mutationFn: async (p: Post) => {
      const { error } = await supabase.from("news_posts").update({ published: !p.published }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-news"] }); qc.invalidateQueries({ queryKey: ["news"] }); },
  });

  return (
    <div>
      <PageHeader
        title="News & Media"
        subtitle="VIP testimonials, campaign videos, awards and company news shown on the public /news page."
        actions={
          <>
            <Link to="/news" target="_blank" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:border-cyan">
              <Eye className="h-4 w-4" /> View live <ExternalLink className="h-3 w-3" />
            </Link>
            <PrimaryButton onClick={() => setEditing({ ...empty })}>
              <Plus className="h-4 w-4" /> New post
            </PrimaryButton>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, customer or slug…"
            className="w-72 rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm shadow-sm focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1 text-xs">
          {[
            { k: "all", l: "All" },
            { k: "testimonial", l: "Testimonials" },
            { k: "video", l: "Videos" },
            { k: "award", l: "Awards" },
            { k: "news", l: "News" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setCat(t.k)}
              className={`rounded px-3 py-1.5 font-semibold transition ${cat === t.k ? "bg-navy text-white" : "text-navy/70 hover:bg-muted"}`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No posts yet"
          body="Create your first VIP testimonial, campaign video, award or news item."
          action={<PrimaryButton onClick={() => setEditing({ ...empty })}><Plus className="h-4 w-4" /> New post</PrimaryButton>}
        />
      ) : (
        <TableShell>
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Post</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      {p.cover_url && <img src={p.cover_url} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy">{p.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{p.customer_name || p.award_issuer || p.subtitle || `/news/${p.slug}`}</p>
                    </div>
                    {p.featured && <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <CategoryPill c={p.category} />
                </td>
                <td className="px-4 py-3">
                  <Pill tone={p.published ? "green" : "muted"}>{p.published ? "Published" : "Draft"}</Pill>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(p.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button title={p.published ? "Unpublish" : "Publish"} onClick={() => togglePublish.mutate(p)} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-navy">
                      {p.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button title="Edit" onClick={() => setEditing(p)} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-navy">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button title="Delete" onClick={() => { if (confirm(`Delete "${p.title}"?`)) del.mutate(p.id); }} className="rounded-md p-2 text-muted-foreground hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      {editing && (
        <PostFormDialog
          post={editing}
          onClose={() => setEditing(null)}
          onSave={(p) => save.mutate(p)}
          saving={save.isPending}
        />
      )}
    </div>
  );
}

function CategoryPill({ c }: { c: Post["category"] }) {
  const map = {
    testimonial: { tone: "cyan" as const, icon: Quote, label: "Testimonial" },
    video: { tone: "blue" as const, icon: PlayCircle, label: "Video" },
    award: { tone: "amber" as const, icon: Award, label: "Award" },
    news: { tone: "muted" as const, icon: Newspaper, label: "News" },
  };
  const { tone, icon: Icon, label } = map[c];
  return <Pill tone={tone}><span className="inline-flex items-center gap-1"><Icon className="h-3 w-3" /> {label}</span></Pill>;
}

function PostFormDialog({ post, onClose, onSave, saving }: { post: Partial<Post>; onClose: () => void; onSave: (p: Partial<Post>) => void; saving: boolean }) {
  const [form, setForm] = useState<Partial<Post>>(post);
  const isEdit = !!post.id;
  const set = (k: keyof Post, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const tagsText = Array.isArray(form.tags) ? form.tags.join(", ") : (form.tags as any) ?? "";

  return (
    <FormDialog
      open={true}
      onClose={onClose}
      title={isEdit ? "Edit post" : "New post"}
      subtitle={isEdit ? "Update an existing News & Media item." : "Create a VIP testimonial, video, award or news item."}
      size="xl"
      footer={
        <>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton disabled={saving} onClick={() => onSave(form)}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create post"}
          </PrimaryButton>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FieldGroup label="Category" required>
          <Select value={form.category} onChange={(e) => set("category", e.target.value)}>
            <option value="testimonial">VIP Testimonial</option>
            <option value="video">Marketing / Campaign Video</option>
            <option value="award">Award</option>
            <option value="news">Company News</option>
          </Select>
        </FieldGroup>
        <FieldGroup label="Slug" hint="URL: /news/<slug>. Leave empty to auto-generate from title." required>
          <Input value={form.slug ?? ""} onChange={(e) => set("slug", e.target.value)} placeholder="auto from title" />
        </FieldGroup>

        <div className="md:col-span-2">
          <FieldGroup label="Title" required>
            <Input value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder='e.g. "They moved 40 people without a single delay."' />
          </FieldGroup>
        </div>
        <div className="md:col-span-2">
          <FieldGroup label="Subtitle / Eyebrow" hint="Small label shown above the title (e.g. organization or category).">
            <Input value={form.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} />
          </FieldGroup>
        </div>

        <div className="md:col-span-2">
          <FieldGroup label="Excerpt" hint="1–2 sentence summary shown on cards and as the lead quote.">
            <Textarea rows={2} value={form.excerpt ?? ""} onChange={(e) => set("excerpt", e.target.value)} />
          </FieldGroup>
        </div>
        <div className="md:col-span-2">
          <FieldGroup label="Body" hint="Full story (separate paragraphs with blank lines).">
            <Textarea rows={6} value={form.body ?? ""} onChange={(e) => set("body", e.target.value)} />
          </FieldGroup>
        </div>

        <div>
          <ImageUploader
            label="Cover image"
            value={form.cover_url ?? null}
            onChange={(url) => set("cover_url", url)}
            folder="news/covers"
            aspect="video"
          />
          <p className="mt-1 text-xs text-muted-foreground">Or paste a URL:</p>
          <Input value={form.cover_url ?? ""} onChange={(e) => set("cover_url", e.target.value)} placeholder="https://…" />
        </div>
        <FieldGroup label="Video URL" hint="YouTube, Vimeo or Facebook video link. Auto-embedded on the detail page.">
          <Input value={form.video_url ?? ""} onChange={(e) => set("video_url", e.target.value)} placeholder="https://www.facebook.com/…/videos/…" />
        </FieldGroup>

        <div className="md:col-span-2">
          <GalleryEditor
            value={Array.isArray(form.gallery) ? form.gallery : []}
            onChange={(g) => set("gallery", g)}
          />
        </div>

        {form.category === "testimonial" && (
          <>
            <FieldGroup label="Customer name">
              <Input value={form.customer_name ?? ""} onChange={(e) => set("customer_name", e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Customer title / role">
              <Input value={form.customer_title ?? ""} onChange={(e) => set("customer_title", e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Company / Organization">
              <Input value={form.customer_company ?? ""} onChange={(e) => set("customer_company", e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Rating (1–5)">
              <Input type="number" min={1} max={5} value={form.rating ?? 5} onChange={(e) => set("rating", Number(e.target.value))} />
            </FieldGroup>
          </>
        )}

        {form.category === "award" && (
          <>
            <FieldGroup label="Awarded by">
              <Input value={form.award_issuer ?? ""} onChange={(e) => set("award_issuer", e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Event date">
              <Input type="date" value={form.event_date ?? ""} onChange={(e) => set("event_date", e.target.value)} />
            </FieldGroup>
          </>
        )}

        <div className="md:col-span-2">
          <FieldGroup label="Tags" hint="Comma-separated (e.g. government, vip, fleet).">
            <Input
              value={tagsText}
              onChange={(e) => set("tags", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            />
          </FieldGroup>
        </div>

        <FieldGroup label="Sort order" hint="Higher numbers appear first within their category.">
          <Input type="number" value={form.sort_order ?? 0} onChange={(e) => set("sort_order", Number(e.target.value))} />
        </FieldGroup>

        <div className="flex items-end gap-4">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.published} onChange={(e) => set("published", e.target.checked)} className="h-4 w-4 rounded border-input text-cyan" />
            <span className="font-medium text-navy">Published</span>
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 rounded border-input text-cyan" />
            <span className="font-medium text-navy">Featured</span>
          </label>
        </div>
      </div>
    </FormDialog>
  );
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function GalleryEditor({ value, onChange }: { value: string[]; onChange: (g: string[]) => void }) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const items = value ?? [];

  const add = (url: string | null) => {
    if (!url) return;
    onChange([...(items ?? []), url]);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= items.length) return;
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(next);
  };

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-navy">Photo gallery</p>
          <p className="text-xs text-muted-foreground">
            Add multiple photos shown on the story page. Drag to reorder. First image becomes the cover if none is set.
          </p>
        </div>
        <span className="rounded-full bg-cyan/10 px-2.5 py-1 text-[11px] font-bold text-cyan">{items.length} photo{items.length === 1 ? "" : "s"}</span>
      </div>

      {items.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((url, i) => (
            <div
              key={`${url}-${i}`}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragIndex !== null) move(dragIndex, i); setDragIndex(null); }}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-card shadow-sm"
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-1.5">
                <span className="inline-flex items-center gap-1 rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-navy">
                  <GripVertical className="h-3 w-3" /> {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded-full bg-rose-500 p-1 text-white opacity-0 transition group-hover:opacity-100"
                  aria-label="Remove photo"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="rounded bg-white/95 px-2 py-0.5 text-[10px] font-bold text-navy disabled:opacity-30">←</button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === items.length - 1} className="rounded bg-white/95 px-2 py-0.5 text-[10px] font-bold text-navy disabled:opacity-30">→</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <ImageUploader
          label="Add photo (upload)"
          value={null}
          onChange={(url) => add(url)}
          folder="news/gallery"
          aspect="square"
        />
        <UrlAdder onAdd={add} />
      </div>
    </div>
  );
}

function UrlAdder({ onAdd }: { onAdd: (url: string) => void }) {
  const [url, setUrl] = useState("");
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add photo (paste URL)</label>
      <div className="flex h-full min-h-[140px] flex-col items-stretch justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 p-4">
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        <button
          type="button"
          onClick={() => { if (url.trim()) { onAdd(url.trim()); setUrl(""); } }}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white transition hover:bg-navy/90"
        >
          <PlusIcon className="h-3.5 w-3.5" /> Add to gallery
        </button>
      </div>
    </div>
  );
}