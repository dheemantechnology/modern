import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, Car, Crown, Shield, Phone, MessageCircle, CalendarCheck, CreditCard, KeyRound,
  CheckCircle2, Quote, IdCard, FileText, Fuel, MapPin, Plane, Briefcase, Users, Clock, Wrench,
  BadgeCheck, Headphones, Sparkles, AlertCircle, Truck, Building2, RefreshCw, ChevronLeft, ChevronRight,
  Newspaper, Award, PlayCircle, Star, TrendingUp, Calendar,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PartnersMarquee } from "@/components/site/PartnersMarquee";
import { fleet, startingPrice, tierColors, tierLabel, type Tier } from "@/data/fleet";
import { useHomeContent } from "@/lib/cms/use-cms";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Car Rental in Hargeisa | Modern Multi Services" },
      { name: "description", content: "Rent Luxury cars, Mini SUVs and Sedan cars in Hargeisa from $19/day. Free city delivery, mobile-money payments, bilingual contracts." },
      { property: "og:title", content: "Modern Multi Services — Car Rental in Hargeisa" },
      { property: "og:description", content: "Somaliland's largest, most trusted car rental fleet." },
      { property: "og:url", content: "https://modern.somalilandsystems.com/" },
    ],
    links: [
      { rel: "canonical", href: "https://modern.somalilandsystems.com/" },
    ],
  }),
  component: Home,
});

const tierIcons: Record<Tier, typeof Crown> = { Luxury: Crown, "Mini SUV": Car, Sedan: Briefcase };
const stepIcons = [Car, CalendarCheck, KeyRound];
const trustIcons = [BadgeCheck, Truck, Headphones, Sparkles];
const reqIcons = [IdCard, FileText, Users, CreditCard];
const protectionIcons = [Shield, Wrench, RefreshCw, BadgeCheck];
const useCaseIcons = [Plane, Briefcase, MapPin, Users];
const policyIcons = [Fuel, Clock, AlertCircle];
const whyCardIcons = [CreditCard, Shield, MessageCircle, CalendarCheck];

/* ─── News Section ─── */
type NewsPost = {
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
  rating: number | null;
  award_issuer: string | null;
  published_at: string;
};

function useLatestNews() {
  return useQuery({
    queryKey: ["home", "news-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_posts")
        .select("id,category,slug,title,subtitle,excerpt,cover_url,video_url,customer_name,customer_title,rating,award_issuer,published_at")
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return (data ?? []) as NewsPost[];
    },
    staleTime: 60_000,
  });
}

function NewsSection() {
  const { data: posts = [], isLoading } = useLatestNews();

  const featured = posts[0];
  const sidePosts = posts.slice(1, 4);

  const catMeta: Record<NewsPost["category"], { icon: typeof Quote; label: string; bg: string; text: string }> = {
    testimonial: { icon: Quote, label: "VIP Testimonial", bg: "bg-navy", text: "text-white" },
    video: { icon: PlayCircle, label: "Campaign", bg: "bg-cyan", text: "text-navy" },
    award: { icon: Award, label: "Award", bg: "bg-amber-500", text: "text-white" },
    news: { icon: Newspaper, label: "News", bg: "bg-midblue", text: "text-white" },
  };

  if (isLoading) {
    return (
      <section className="border-y border-border bg-background py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="aspect-[16/10] animate-pulse rounded-2xl bg-muted" />
            <div className="grid gap-4">
              <div className="h-32 animate-pulse rounded-xl bg-muted" />
              <div className="h-32 animate-pulse rounded-xl bg-muted" />
              <div className="h-32 animate-pulse rounded-xl bg-muted" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (posts.length === 0) return null;

  return (
    <section className="border-y border-border bg-background py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan">
              <span className="h-px w-8 bg-cyan" /> Latest from the road
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-[1.1] text-navy md:text-4xl">
              Stories worth telling. <span className="text-muted-foreground">Moments worth sharing.</span>
            </h2>
          </div>
          <Link
            to="/news"
            className="hidden items-center gap-2 text-sm font-semibold text-cyan transition hover:gap-3 md:inline-flex"
          >
            Explore all stories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Grid: Featured left + stacked right */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Featured card */}
          {featured && (
            <Link
              to="/news/$slug"
              params={{ slug: featured.slug }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:shadow-elegant"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                {featured.cover_url ? (
                  <img
                    src={featured.cover_url}
                    alt={featured.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy to-midblue">
                    <TrendingUp className="h-16 w-16 text-white/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-transparent" />
                {/* Category badge */}
                {(() => {
                  const meta = catMeta[featured.category];
                  const Icon = meta.icon;
                  return (
                    <span className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full ${meta.bg} ${meta.text} px-3 py-1 text-[11px] font-bold uppercase tracking-wider`}>
                      <Icon className="h-3.5 w-3.5" /> {meta.label}
                    </span>
                  );
                })()}
                {featured.video_url && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-lg transition group-hover:scale-110">
                      <PlayCircle className="h-7 w-7 text-navy" />
                    </div>
                  </div>
                )}
                {/* Bottom overlay text */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  {featured.subtitle && (
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-cyan">{featured.subtitle}</p>
                  )}
                  <h3 className="mt-1.5 font-display text-xl font-bold leading-snug text-white md:text-2xl">
                    {featured.title}
                  </h3>
                  {featured.excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm text-white/80">{featured.excerpt}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-xs text-white/70">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(featured.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    {featured.rating && (
                      <span className="inline-flex items-center gap-0.5 text-amber-300">
                        {Array.from({ length: featured.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-amber-300" />
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Side stack */}
          <div className="flex flex-col gap-4">
            {sidePosts.map((post) => {
              const meta = catMeta[post.category];
              const Icon = meta.icon;
              return (
                <Link
                  key={post.id}
                  to="/news/$slug"
                  params={{ slug: post.slug }}
                  className="group flex gap-4 overflow-hidden rounded-xl border border-border bg-card p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-elegant"
                >
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted sm:h-28 sm:w-28">
                    {post.cover_url ? (
                      <img
                        src={post.cover_url}
                        alt={post.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy to-cyan">
                        <Icon className="h-8 w-8 text-white/40" />
                      </div>
                    )}
                    {post.video_url && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90">
                          <PlayCircle className="h-4 w-4 text-navy" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-center py-1">
                    <span className={`inline-flex w-fit items-center gap-1 rounded-full ${meta.bg} ${meta.text} px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider`}>
                      <Icon className="h-3 w-3" /> {meta.label}
                    </span>
                    <h3 className="mt-2 font-display text-sm font-bold leading-snug text-navy line-clamp-2 sm:text-base">
                      {post.title}
                    </h3>
                    {post.customer_name && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        — {post.customer_name}{post.customer_title ? `, ${post.customer_title}` : ""}
                      </p>
                    )}
                    {post.award_issuer && !post.customer_name && (
                      <p className="mt-1 text-xs font-semibold text-amber-600">{post.award_issuer}</p>
                    )}
                    {!post.customer_name && !post.award_issuer && post.excerpt && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{post.excerpt}</p>
                    )}
                    <div className="mt-auto flex items-center gap-2 pt-2 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 flex justify-center md:hidden">
          <Link
            to="/news"
            className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white"
          >
            View all stories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Home() {
  const C = useHomeContent();
  const slides = C.hero.slides.map((s) => {
    const v = fleet.find((f) => f.id === s.imageId) ?? fleet[0];
    return { ...s, image: v.image };
  });
  const featured = [
    fleet.find((v) => v.id === "toyota-v8-2024")!,
    fleet.find((v) => v.id === "toyota-rav4-2023")!,
    fleet.find((v) => v.id === "mazda-cx5-2019")!,
    fleet.find((v) => v.id === "toyota-noah-2017")!,
  ];

  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((p) => (p + 1) % slides.length), 6000); return () => clearInterval(t); }, [slides.length]);
  const slide = slides[i] ?? slides[0];

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {slides.map((s, idx) => (
            <img
              key={idx}
              src={s.image}
              alt=""
              width={1920}
              height={1080}
              loading={idx === 0 ? "eager" : "lazy"}
              fetchPriority={idx === 0 ? "high" : "low"}
              decoding="async"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ${idx === i ? "opacity-100 scale-105" : "opacity-0"}`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/80 to-navy/40" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" />{slide.kicker}
            </span>
            <h1 key={i} className="mt-5 font-display text-4xl font-bold leading-[1.05] text-white md:text-6xl">
              {slide.title}<br /><span className="bg-gradient-to-r from-cyan to-white bg-clip-text text-transparent">{slide.accent}</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-white/85 md:text-lg">{slide.text}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to={C.hero.primaryCta.href as any} className="inline-flex items-center gap-2 rounded-full bg-gradient-cyan px-6 py-3 text-sm font-semibold text-white shadow-elegant">
                {C.hero.primaryCta.label} <ArrowRight className="h-4 w-4" />
              </Link>
              <a href={C.hero.secondaryCta.href} className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur"><Phone className="h-4 w-4" /> {C.hero.secondaryCta.label}</a>
            </div>
            <div className="mt-10 flex items-center gap-4">
              <button aria-label="Previous slide" onClick={() => setI((p) => (p - 1 + slides.length) % slides.length)} className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-white/5 text-white backdrop-blur"><ChevronLeft className="h-4 w-4" /></button>
              <div className="flex items-center gap-2">{slides.map((_, idx) => (
                <button key={idx} aria-label={`Go to slide ${idx + 1}`} aria-current={idx === i ? "true" : undefined} onClick={() => setI(idx)} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-8 bg-cyan" : "w-4 bg-white/30"}`} />
              ))}</div>
              <button aria-label="Next slide" onClick={() => setI((p) => (p + 1) % slides.length)} className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-white/5 text-white backdrop-blur"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-4 px-4 py-6 md:grid-cols-4 md:px-8">
          {C.trustBadges.map((b, idx) => { const Icon = trustIcons[idx % trustIcons.length]; return (
            <div key={idx} className="flex items-center gap-3 px-2">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-tint text-cyan"><Icon className="h-5 w-5" /></div>
              <div><p className="text-sm font-semibold text-navy">{b.title}</p><p className="text-xs text-muted-foreground">{b.subtitle}</p></div>
            </div>
          );})}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative bg-background py-16 md:py-20">
        <div className="relative mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan"><span className="h-px w-8 bg-cyan" /> {C.howItWorks.eyebrow}</p>
              <h2 className="mt-3 font-display text-3xl font-bold leading-[1.1] text-navy md:text-4xl">{C.howItWorks.headingLead}<br /><span className="text-muted-foreground">{C.howItWorks.headingTail}</span></h2>
            </div>
            <p className="max-w-sm text-sm text-muted-foreground">{C.howItWorks.intro}</p>
          </div>
          <ol className="relative mt-12 grid gap-6 md:grid-cols-3">
            {C.howItWorks.steps.map((s, idx) => { const Icon = stepIcons[idx]; return (
              <li key={idx} className="group relative">
                <div className="flex items-center gap-4">
                  <div className="grid h-[72px] w-[72px] place-items-center rounded-full border border-border bg-card shadow-card">
                    <span className="font-display text-2xl font-bold text-navy">0{idx + 1}</span>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl border border-border bg-card p-6">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-tint px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-navy"><Icon className="h-3 w-3 text-cyan" />{s.tag}</span>
                  <h3 className="mt-3 font-display text-xl font-semibold text-navy">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.meta}</span>
                  </div>
                </div>
              </li>
            );})}
          </ol>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-border bg-gradient-to-r from-navy to-midblue p-5 text-white">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10"><Clock className="h-5 w-5" /></div>
              <div><p className="text-xs font-semibold uppercase tracking-widest text-cyan">{C.howItWorks.promiseEyebrow}</p><p className="mt-1 font-display text-lg font-semibold md:text-xl">{C.howItWorks.promiseText}</p></div>
            </div>
            <Link to="/fleet" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-navy">{C.howItWorks.promiseCta} <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* FLEET PREVIEW */}
      <section className="bg-tint/60 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-cyan">{C.fleetSection.eyebrow}</p>
              <h2 className="mt-2 text-3xl font-bold md:text-4xl">{C.fleetSection.title}</h2>
              <p className="mt-3 text-base text-muted-foreground">{C.fleetSection.body}</p>
            </div>
            <Link to="/fleet" className="hidden items-center gap-2 text-sm font-semibold text-cyan md:inline-flex">See full fleet <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {C.fleetSection.tiers.map((t) => { const Icon = tierIcons[t.tier as Tier] ?? Car; return (
              <div key={t.tier} className="rounded-xl border border-border bg-card/80 p-4">
                <div className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${tierColors[t.tier as Tier] ?? "from-navy to-blue"} px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white`}><Icon className="h-3 w-3" />{tierLabel[t.tier as Tier] ?? t.tier}</div>
                <p className="mt-2 text-sm font-semibold text-navy">{t.tagline}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t.bestFor}</p>
              </div>
            );})}
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((t) => { const Icon = tierIcons[t.tier]; return (
              <article key={t.id} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                <div className="relative aspect-[4/3] overflow-hidden bg-tint">
                  <img src={t.image} alt={`${t.name} ${t.year}`} loading="lazy" className="h-full w-full object-cover" />
                  <span className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${tierColors[t.tier]} px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white`}><Icon className="h-3 w-3" />{tierLabel[t.tier]}</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-semibold text-navy">{t.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.year} · {t.seats} seats · {t.transmission}</p>
                  <div className="mt-4 flex items-end justify-between">
                    <div><p className="text-xs uppercase tracking-wider text-muted-foreground">From</p><p className="font-display text-2xl font-bold text-navy">${startingPrice(t)}<span className="text-sm font-medium text-muted-foreground"> / day</span></p></div>
                    <Link to="/fleet/$vehicleId" params={{ vehicleId: t.id }} className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white">View <ArrowRight className="h-3.5 w-3.5" /></Link>
                  </div>
                </div>
              </article>
            );})}
          </div>
        </div>
      </section>

      {/* REQUIREMENTS */}
      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan">{C.requirements.eyebrow}</p>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">{C.requirements.title}</h2>
            <p className="mt-3 text-base text-muted-foreground">{C.requirements.body}</p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {C.requirements.items.map((r, idx) => { const Icon = reqIcons[idx % reqIcons.length]; return (
              <div key={idx} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-tint text-cyan"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-3 text-base font-semibold">{r.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{r.text}</p>
              </div>
            );})}
          </div>
        </div>
      </section>

      {/* INCLUDED */}
      <section className="bg-tint/60 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-cyan">{C.included.eyebrow}</p>
              <h2 className="mt-2 text-3xl font-bold md:text-4xl">{C.included.title}</h2>
              <p className="mt-3 text-base text-muted-foreground">{C.included.body}</p>
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {C.included.list.map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan" /><span>{line}</span></li>
                ))}
              </ul>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {C.included.protections.map((b, idx) => { const Icon = protectionIcons[idx % protectionIcons.length]; return (
                <div key={b.title} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-cyan text-white"><Icon className="h-5 w-5" /></div>
                  <h3 className="mt-3 text-base font-semibold">{b.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{b.body}</p>
                </div>
              );})}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan">{C.pricing.eyebrow}</p>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">{C.pricing.title}</h2>
            <p className="mt-3 text-base text-muted-foreground">{C.pricing.body}</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {C.pricing.tiers.map((p) => (
              <div key={p.range} className="rounded-2xl border border-border bg-gradient-to-br from-card to-tint/40 p-5 text-center shadow-card">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{p.range}</p>
                <p className="mt-2 font-display text-2xl font-bold text-navy">{p.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {C.pricing.policies.map((p, idx) => { const Icon = policyIcons[idx % policyIcons.length]; return (
              <div key={p.title} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-tint text-cyan"><Icon className="h-5 w-5" /></div>
                <div><h3 className="text-base font-semibold">{p.title}</h3><p className="mt-1 text-sm text-muted-foreground">{p.body}</p></div>
              </div>
            );})}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="bg-tint/60 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan">{C.useCases.eyebrow}</p>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">{C.useCases.title}</h2>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {C.useCases.items.map((u, idx) => { const Icon = useCaseIcons[idx % useCaseIcons.length]; return (
              <div key={u.title} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-cyan text-white"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-3 text-base font-semibold">{u.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{u.body}</p>
              </div>
            );})}
          </div>
        </div>
      </section>

      {/* DESTINATIONS */}
      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-cyan">{C.destinations.eyebrow}</p>
              <h2 className="mt-2 text-3xl font-bold md:text-4xl">{C.destinations.title}</h2>
              <p className="mt-3 text-base text-muted-foreground">{C.destinations.body}</p>
              <Link to="/contact" className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white">Plan a custom route <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {C.destinations.items.map((d) => (
                <div key={d.name} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3.5">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan" />
                  <div className="flex-1"><p className="text-sm font-semibold text-navy">{d.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{d.km} · {d.note}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CORPORATE */}
      <section className="bg-tint/60 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-navy to-midblue p-8 text-white shadow-elegant md:p-12">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider"><Building2 className="h-3.5 w-3.5" /> {C.corporate.eyebrow}</div>
                <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl"><span className="bg-gradient-to-r from-cyan to-white bg-clip-text text-transparent">{C.corporate.title}</span></h2>
                <p className="mt-3 max-w-xl text-white/85">{C.corporate.body}</p>
              </div>
              <ul className="grid gap-2.5">
                {C.corporate.bullets.map((line) => (<li key={line} className="flex items-start gap-2.5 text-sm text-white/90"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan" /><span>{line}</span></li>))}
                <li className="mt-3"><Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-gradient-cyan px-6 py-3 text-sm font-semibold text-white">{C.corporate.ctaLabel} <ArrowRight className="h-4 w-4" /></Link></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* WHY US */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-cyan">{C.whyUs.eyebrow}</p>
              <h2 className="mt-2 text-3xl font-bold md:text-4xl">{C.whyUs.title}</h2>
              <p className="mt-3 text-base text-muted-foreground">{C.whyUs.body}</p>
              <div className="mt-6 space-y-3">
                {C.whyUs.bullets.map((line) => (
                  <div key={line} className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan" /><p className="text-sm md:text-base">{line}</p></div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {C.whyUs.cards.map((b, idx) => { const Icon = whyCardIcons[idx % whyCardIcons.length]; return (
                <div key={b.title} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-tint text-cyan"><Icon className="h-5 w-5" /></div>
                  <h3 className="mt-3 text-base font-semibold">{b.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{b.body}</p>
                </div>
              );})}
            </div>
          </div>
        </div>
      </section>

      <PartnersMarquee />

      {/* TESTIMONIALS */}
      <section className="bg-gradient-hero py-16 md:py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan">{C.testimonials.eyebrow}</p>
            <h2 className="mt-2 text-3xl font-bold text-white md:text-4xl">{C.testimonials.title}</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {C.testimonials.items.map((t) => (
              <figure key={t.name} className="rounded-2xl border border-white/15 bg-white/[0.06] p-6 backdrop-blur">
                <Quote className="h-7 w-7 text-cyan" />
                <blockquote className="mt-3 text-[15px] leading-relaxed text-white/90">"{t.text}"</blockquote>
                <figcaption className="mt-5 border-t border-white/15 pt-3"><p className="text-sm font-semibold">{t.name}</p><p className="text-xs text-white/60">{t.role}</p></figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-white/80">
            <span className="text-xs uppercase tracking-widest text-white/50">{C.testimonials.paymentsLabel}</span>
            {C.testimonials.payments.map((p) => (<span key={p} className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-sm font-medium">{p}</span>))}
          </div>
        </div>
      </section>

      {/* NEWS & STORIES */}
      <NewsSection />

      {/* FAQ */}
      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan">{C.faqs.eyebrow}</p>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">{C.faqs.title}</h2>
            <p className="mt-3 text-base text-muted-foreground">{C.faqs.body}</p>
          </div>
          <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card shadow-card">
            {C.faqs.items.map((f) => (
              <details key={f.q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-left">
                  <h3 className="text-base font-semibold text-navy md:text-lg">{f.q}</h3>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-tint text-cyan transition group-open:rotate-45"><span className="text-xl leading-none">+</span></span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="overflow-hidden rounded-3xl bg-gradient-cyan p-8 text-center text-white shadow-elegant md:p-12">
            <h2 className="font-display text-3xl font-bold text-white md:text-4xl">{C.finalCta.title}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-white/85">{C.finalCta.body}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/fleet" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-navy">Browse fleet <ArrowRight className="h-4 w-4" /></Link>
              <a href="tel:3032" className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-7 py-3.5 text-base font-semibold text-white"><Phone className="h-4 w-4" /> Call 3032</a>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}