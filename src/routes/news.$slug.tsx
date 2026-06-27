import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Quote, Award, PlayCircle, Newspaper, Star, Calendar, Share2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/news/$slug")({
  component: NewsDetail,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-navy">Story not found</h1>
        <p className="mt-2 text-muted-foreground">This story may have been removed or unpublished.</p>
        <Link to="/news" className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white">
          <ArrowLeft className="h-4 w-4" /> Back to News
        </Link>
      </div>
    </SiteLayout>
  ),
  errorComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-navy">Something went wrong</h1>
        <Link to="/news" className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white">
          <ArrowLeft className="h-4 w-4" /> Back to News
        </Link>
      </div>
    </SiteLayout>
  ),
});

function NewsDetail() {
  const { slug } = Route.useParams();
  const { data: post, isLoading } = useQuery({
    queryKey: ["news", "detail", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-4xl px-4 py-24">
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-6 h-12 w-3/4 animate-pulse rounded bg-muted" />
          <div className="mt-10 aspect-video w-full animate-pulse rounded-2xl bg-muted" />
        </div>
      </SiteLayout>
    );
  }

  if (!post) throw notFound();

  const Icon = post.category === "testimonial" ? Quote : post.category === "video" ? PlayCircle : post.category === "award" ? Award : Newspaper;
  const embed = post.video_url ? toEmbed(post.video_url) : null;
  const gallery: string[] = Array.isArray(post.gallery)
    ? (post.gallery as unknown[]).filter((u): u is string => typeof u === "string" && u.length > 0)
    : [];

  return (
    <SiteLayout>
      <article className="bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden bg-navy">
          {post.cover_url && (
            <>
              <img src={post.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-b from-navy/60 via-navy/80 to-navy" />
            </>
          )}
          <div className="relative mx-auto max-w-4xl px-4 py-20 md:px-8 md:py-28">
            <Link to="/news" className="inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-cyan">
              <ArrowLeft className="h-4 w-4" /> All stories
            </Link>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-cyan px-3 py-1 text-xs font-bold uppercase tracking-wider text-navy">
              <Icon className="h-3.5 w-3.5" /> {label(post.category)}
            </div>
            {post.subtitle && <p className="mt-4 text-sm font-semibold uppercase tracking-widest text-cyan/90">{post.subtitle}</p>}
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-white md:text-5xl">{post.title}</h1>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/70">
              <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {new Date(post.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
              {post.rating && (
                <span className="inline-flex items-center gap-0.5 text-amber-300">
                  {Array.from({ length: post.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-300" />)}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Body */}
        <section className="mx-auto max-w-3xl px-4 py-12 md:py-16 md:px-8">
          {embed && (
            <div className="mb-10 overflow-hidden rounded-2xl border border-border bg-black shadow-elegant">
              <div className="relative aspect-video">
                <iframe
                  src={embed}
                  title={post.title}
                  className="absolute inset-0 h-full w-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {post.excerpt && (
            <p className="border-l-4 border-cyan pl-5 font-display text-xl italic text-navy md:text-2xl">
              {post.excerpt}
            </p>
          )}

          {post.body && (
            <div className="prose prose-lg mt-8 max-w-none text-foreground">
              {post.body.split(/\n\n+/).map((p: string, i: number) => (
                <p key={i} className="mb-5 leading-relaxed text-foreground/90">{p}</p>
              ))}
            </div>
          )}

          {gallery.length > 0 && <Gallery images={gallery} title={post.title} />}

          {/* Attribution cards */}
          {post.category === "testimonial" && post.customer_name && (
            <div className="mt-10 rounded-2xl border border-border bg-tint/40 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-cyan font-display text-xl font-bold text-white">
                  {post.customer_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <p className="font-display text-lg font-bold text-navy">{post.customer_name}</p>
                  {post.customer_title && <p className="text-sm text-muted-foreground">{post.customer_title}</p>}
                  {post.customer_company && <p className="text-sm font-semibold text-cyan">{post.customer_company}</p>}
                </div>
              </div>
            </div>
          )}

          {post.category === "award" && post.award_issuer && (
            <div className="mt-10 flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <Award className="h-10 w-10 shrink-0 text-amber-600" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Awarded by</p>
                <p className="font-display text-lg font-bold text-navy">{post.award_issuer}</p>
                {post.event_date && <p className="text-sm text-muted-foreground">{new Date(post.event_date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>}
              </div>
            </div>
          )}

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
              {post.tags.map((t: string) => (
                <span key={t} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">#{t}</span>
              ))}
            </div>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            <Link to="/news" className="inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-cyan">
              <ArrowLeft className="h-4 w-4" /> Back to all stories
            </Link>
            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== "undefined" && (navigator as any).share) {
                  (navigator as any).share({ title: post.title, url: window.location.href }).catch(() => {});
                } else if (typeof navigator !== "undefined") {
                  navigator.clipboard?.writeText(window.location.href);
                }
              }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-navy transition hover:border-cyan"
            >
              <Share2 className="h-4 w-4" /> Share story
            </button>
          </div>
        </section>
      </article>
    </SiteLayout>
  );
}

function label(c: string) {
  return c === "testimonial" ? "VIP Testimonial" : c === "video" ? "Campaign Video" : c === "award" ? "Award" : "News";
}

function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState<number | null>(null);
  return (
    <section className="mt-12">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan">Gallery</p>
          <h2 className="font-display text-2xl font-bold text-navy">Moments from this story</h2>
        </div>
        <span className="text-xs text-muted-foreground">{images.length} photo{images.length === 1 ? "" : "s"}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {images.map((url, i) => (
          <button
            key={`${url}-${i}`}
            type="button"
            onClick={() => setActive(i)}
            className={`group relative overflow-hidden rounded-xl border border-border bg-muted shadow-card transition hover:-translate-y-0.5 hover:shadow-elegant ${i === 0 ? "col-span-2 row-span-2 aspect-[16/10] md:col-span-2 md:row-span-2" : "aspect-square"}`}
          >
            <img src={url} alt={`${title} — photo ${i + 1}`} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100">
              {i + 1} / {images.length}
            </span>
          </button>
        ))}
      </div>

      {active !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); setActive(null); }}
          >Close ✕</button>
          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-lg font-bold text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); setActive((a) => (a === null ? 0 : (a - 1 + images.length) % images.length)); }}
            aria-label="Previous"
          >‹</button>
          <img
            src={images[active]}
            alt={`${title} — photo ${active + 1}`}
            className="max-h-[88vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-lg font-bold text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); setActive((a) => (a === null ? 0 : (a + 1) % images.length)); }}
            aria-label="Next"
          >›</button>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
            {active + 1} / {images.length}
          </span>
        </div>
      )}
    </section>
  );
}

function toEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      const id = u.hostname.includes("youtu.be") ? u.pathname.slice(1) : u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes("facebook.com")) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=false`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  } catch {
    return null;
  }
}