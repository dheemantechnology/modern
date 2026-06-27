import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Award, ShieldCheck, Users, MapPin, Heart, Sparkles, Car, TrendingUp, Mail, Phone, Linkedin, Quote, Trophy, Flame, Rocket } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import heroCar from "@/assets/hero-car.jpg";
import { useAboutContent } from "@/lib/cms/use-cms";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Modern Multi Services" },
      { name: "description", content: "From a single car to Somaliland's most trusted rental fleet — learn the story behind Modern Multi Services in Hargeisa." },
      { property: "og:title", content: "About Modern Multi Services" },
      { property: "og:description", content: "The pioneers of professional car rental in Somaliland." },
      { property: "og:url", content: "https://modern.somalilandsystems.com/about" },
    ],
    links: [
      { rel: "canonical", href: "https://modern.somalilandsystems.com/about" },
    ],
  }),
  component: About,
});

const statIcons = [TrendingUp, Car, Heart, Trophy];
const valueIcons = [ShieldCheck, Heart, Users, Award, MapPin, Sparkles];
const timelineIcons = [Car, Flame, Sparkles, Rocket, Trophy];

function useCountUp(target: number, durationMs = 1600, start = false) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => { const p = Math.min(1, (t - t0) / durationMs); setN(Math.round(target * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [target, durationMs, start]);
  return n;
}
function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null); const [seen, setSeen] = useState(false);
  useEffect(() => { if (!ref.current || seen) return; const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.25 }); io.observe(ref.current); return () => io.disconnect(); }, [seen]);
  return { ref, seen };
}

function About() {
  const C = useAboutContent();
  const stats = useInView<HTMLDivElement>();
  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroCar} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-28 md:px-8 md:py-36">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur"><Sparkles className="h-3.5 w-3.5 text-cyan" /> {C.hero.eyebrow}</div>
          <h1 className="mt-5 max-w-4xl font-display text-4xl font-bold leading-[1.05] text-white md:text-7xl">{C.hero.title} <span className="text-cyan">{C.hero.accent}</span></h1>
          <p className="mt-6 max-w-2xl text-lg text-white/85 md:text-xl">{C.hero.subtitle}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#story" className="inline-flex items-center gap-2 rounded-full bg-cyan px-6 py-3 text-sm font-semibold text-navy">{C.hero.ctaPrimary} <ArrowRight className="h-4 w-4" /></a>
            <a href="#team" className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white">{C.hero.ctaSecondary}</a>
          </div>
        </div>
      </section>

      <section ref={stats.ref} className="relative -mt-16 z-10">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid gap-4 rounded-3xl border border-border bg-card p-4 shadow-elegant sm:grid-cols-2 lg:grid-cols-4">
            {C.stats.map((s, idx) => { const Icon = statIcons[idx % statIcons.length]; return (<StatCard key={idx} value={s.value} suffix={s.suffix} label={s.label} icon={Icon} start={stats.seen} />); })}
          </div>
        </div>
      </section>

      <section id="story" className="py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 md:px-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan">{C.founder.eyebrow}</p>
            <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">{C.founder.title}</h2>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 font-display text-xl font-bold text-white">{C.founder.initials}</div>
              <div><p className="font-semibold">{C.founder.name}</p><p className="text-sm text-muted-foreground">{C.founder.role}</p></div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="relative rounded-3xl border border-border bg-card p-8 shadow-card md:p-12">
              <Quote className="absolute -top-4 -left-2 h-10 w-10 text-cyan" />
              <p className="font-display text-xl leading-relaxed md:text-2xl">"{C.founder.quote}"</p>
              <p className="mt-6 text-sm text-muted-foreground">{C.founder.date}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-tint/40 py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan">{C.timeline.eyebrow}</p>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">{C.timeline.title}</h2>
          <div className="relative mt-14">
            <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-cyan via-cyan/40 to-transparent" />
            <ol className="space-y-8">
              {C.timeline.items.map((m, idx) => { const Icon = timelineIcons[idx % timelineIcons.length]; return (
                <li key={m.year} className="relative grid grid-cols-[2.5rem_1fr] gap-4">
                  <div className="relative"><div className="absolute left-4 top-3 -translate-x-1/2 h-3 w-3 rounded-full bg-cyan ring-4 ring-background" /></div>
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-cyan text-white"><Icon className="h-5 w-5" /></div>
                      <span className="font-display text-2xl font-bold text-cyan">{m.year}</span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-navy">{m.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{m.body}</p>
                  </div>
                </li>
              );})}
            </ol>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan">{C.values.eyebrow}</p>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">{C.values.title}</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {C.values.items.map((v, idx) => { const Icon = valueIcons[idx % valueIcons.length]; return (
              <div key={v.title} className="rounded-2xl border border-border bg-card p-7 shadow-card">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-cyan text-white"><Icon className="h-6 w-6" /></div>
                <h3 className="mt-5 text-lg font-semibold text-navy">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.body}</p>
              </div>
            );})}
          </div>
        </div>
      </section>

      <section id="team" className="bg-tint/40 py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan">{C.team.eyebrow}</p>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">{C.team.title}</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">{C.team.intro}</p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {C.team.members.map((p) => (
              <div key={p.name} className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                <div className={`relative h-44 bg-gradient-to-br ${p.hue} flex items-center justify-center`}>
                  <span className="font-display text-5xl font-bold text-white drop-shadow-lg">{p.initials}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold text-navy">{p.name}</h3>
                  <p className="text-sm font-semibold text-cyan">{p.role}</p>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-3 transition group-hover:line-clamp-none">{p.bio}</p>
                  <div className="mt-4 flex gap-2 opacity-70">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-tint text-navy"><Mail className="h-3.5 w-3.5" /></span>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-tint text-navy"><Phone className="h-3.5 w-3.5" /></span>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-tint text-navy"><Linkedin className="h-3.5 w-3.5" /></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-cyan p-10 text-center text-white shadow-elegant md:p-16">
            <h2 className="relative font-display text-3xl font-bold text-white md:text-5xl">{C.cta.title}</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-white/85">{C.cta.body}</p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/fleet" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-navy">Browse fleet <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-7 py-3.5 text-base font-semibold text-white">Get in touch</Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function StatCard({ value, suffix, label, icon: Icon, start }: { value: number; suffix: string; label: string; icon: any; start: boolean }) {
  const n = useCountUp(value, 1600, start);
  const formatted = value >= 1000 ? n.toLocaleString() : n.toString();
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy to-navy/90 p-6 text-white">
      <Icon className="h-6 w-6 text-cyan" />
      <p className="mt-3 font-display text-4xl font-bold md:text-5xl">{formatted}<span className="text-cyan">{suffix}</span></p>
      <p className="mt-1 text-sm text-white/70">{label}</p>
    </div>
  );
}