import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Quote, Award, Newspaper, PlayCircle, Star, Calendar, ArrowRight, Filter } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/news/")({
  head: () => ({
    meta: [
      { title: "News & Media — VIP Testimonials, Campaigns & Awards | Modern Multi Services" },
      { name: "description", content: "VIP customer testimonials, marketing campaign videos, national awards, and the latest news from Somaliland's first digital car rental company." },
      { property: "og:title", content: "News & Media — Modern Multi Services" },
      { property: "og:description", content: "Testimonials from government, NGOs and enterprise. Campaign videos. Awards. The latest from Modern Multi Services in Hargeisa." },
      { property: "og:url", content: "https://modern.somalilandsystems.com/news" },
    ],
    links: [{ rel: "canonical", href: "https://modern.somalilandsystems.com/news" }],
  }),
  component: NewsIndex,
});

type Post = {
  id: string;
  category: "testimonial" | "video" | "award" | "news";
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
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
  published_at: string;
};

const TABS: { key: "all" | Post["category"]; label: string; icon: any }[] = [
  { key: "all", label: "All stories", icon: Sparkles },
  { key: "testimonial", label: "VIP testimonials", icon: Quote },
  { key: "video", label: "Campaign videos", icon: PlayCircle },
  { key: "award", label: "Awards", icon: Award },
  { key: "news", label: "Company news", icon: Newspaper },
];

function NewsIndex() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["news", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_posts")
        .select("*")
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Post[];
    },
    staleTime: 60_000,
  });

  const filtered = useMemo(
    () => (tab === "all" ? posts : posts.filter((p) => p.category === tab)),
    [posts, tab]
  );
  const featured = useMemo(() => posts.find((p) => p.featured) ?? posts[0], [posts]);

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy">
        <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-cyan" /> News & Media
          </div>
          <h1 className="mt-5 max-w-4xl font-display text-4xl font-bold leading-[1.05] text-white md:text-6xl">
            The voices of our customers.{" "}
            <span className="text-cyan">The story of our country.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/85 md:text-xl">
            Testimonials from the people who trust us with their journeys — government delegations, international organizations, leading enterprises, and the everyday customers who built this company with us. Plus our campaign videos, national awards, and the latest from the road.
          </p>
        </div>
      </section>

      {/* Featured story */}
      {featured && (
        <section className="border-b border-border bg-tint/30">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:px-8 md:py-20">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-elegant">
              {featured.cover_url && (
                <img src={featured.cover_url} alt={featured.title} className="h-full w-full object-cover" loading="eager" />
              )}
              <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-cyan px-3 py-1 text-xs font-bold uppercase tracking-wider text-navy">
                Featured · {labelFor(featured.category)}
              </span>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan">{featured.subtitle ?? "Latest story"}</p>
              <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-navy md:text-4xl">{featured.title}</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">{featured.excerpt}</p>
              {featured.customer_name && (
                <p className="mt-5 text-sm font-semibold text-navy">
                  — {featured.customer_name}
                  {featured.customer_title && <span className="text-muted-foreground font-normal">, {featured.customer_title}</span>}
                </p>
              )}
              <Link
                to="/news/$slug"
                params={{ slug: featured.slug }}
                className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-navy/90"
              >
                Read the full story <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Filters + grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-navy md:text-3xl">All stories</h2>
            <p className="mt-1 text-sm text-muted-foreground">{filtered.length} of {posts.length} published</p>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto rounded-full border border-border bg-card p-1.5 shadow-sm">
            <Filter className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${active ? "bg-navy text-white shadow" : "text-navy/70 hover:bg-muted"}`}
                >
                  <Icon className="h-3.5 w-3.5" /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
            <Newspaper className="mx-auto h-10 w-10 text-cyan" />
            <p className="mt-3 font-semibold text-navy">No stories in this category yet.</p>
            <p className="text-sm text-muted-foreground">Check back soon — we publish new stories every month.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-gradient-to-br from-navy to-navy/90 text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center md:px-8 md:py-20">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Have a story to share?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            We love hearing from the people we serve. Tell us about your experience, and you may see it featured here next.
          </p>
          <Link to="/contact" className="mt-6 inline-flex items-center gap-2 rounded-full bg-cyan px-7 py-3 text-sm font-semibold text-navy transition hover:bg-cyan/90">
            Share your experience <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}

function PostCard({ post }: { post: Post }) {
  const Icon = post.category === "testimonial" ? Quote : post.category === "video" ? PlayCircle : post.category === "award" ? Award : Newspaper;
  return (
    <Link
      to="/news/$slug"
      params={{ slug: post.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-1 hover:shadow-elegant"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {post.cover_url ? (
          <img src={post.cover_url} alt={post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy to-cyan">
            <Icon className="h-12 w-12 text-white/60" />
          </div>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-navy">
          <Icon className="h-3 w-3" /> {labelFor(post.category)}
        </span>
        {post.video_url && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-lg transition group-hover:scale-110">
              <PlayCircle className="h-7 w-7 text-navy" />
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {post.subtitle && <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan">{post.subtitle}</p>}
        <h3 className="mt-1.5 font-display text-lg font-bold leading-snug text-navy line-clamp-2">{post.title}</h3>
        {post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>}
        <div className="mt-4 flex flex-1 items-end justify-between text-xs">
          <div className="text-muted-foreground">
            {post.customer_name ? (
              <span className="font-semibold text-navy">{post.customer_name}</span>
            ) : post.award_issuer ? (
              <span className="font-semibold text-navy">{post.award_issuer}</span>
            ) : (
              <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            )}
          </div>
          {post.rating && (
            <div className="flex items-center gap-0.5 text-amber-500">
              {Array.from({ length: post.rating }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-500" />
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function labelFor(c: Post["category"]) {
  return c === "testimonial" ? "Testimonial" : c === "video" ? "Campaign" : c === "award" ? "Award" : "News";
}