import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, CheckCircle2, Sparkles, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/c/$slug")({
  head: ({ loaderData }) => {
    const c: any = loaderData;
    const url = c ? `https://modern.somalilandsystems.com/c/${c.landing_slug}` : undefined;
    const description = c?.body?.slice(0, 155) ?? "Special offer from Modern Multi Services";
    return {
      meta: [
        { title: c ? `${c.headline || c.name} — MMS` : "Campaign — MMS" },
        { name: "description", content: description },
        { property: "og:title", content: c?.headline || c?.name || "" },
        { property: "og:description", content: description },
        ...(url ? [{ property: "og:url", content: url }] : []),
        ...(c?.creative_url ? [{ property: "og:image", content: c.creative_url }] : []),
      ],
      links: url ? [{ rel: "canonical", href: url }] : [],
    };
  },
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("landing_slug", params.slug)
      .eq("landing_published", true)
      .maybeSingle();
    if (error || !data) throw notFound();
    return data as any;
  },
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center bg-navy text-white p-6 text-center">
      <div>
        <h1 className="font-display text-4xl font-bold">Campaign not found</h1>
        <p className="mt-3 text-white/70">This campaign isn't available or hasn't been published yet.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-cyan px-6 py-3 text-sm font-bold text-navy">Back to home</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen grid place-items-center text-destructive">{error.message}</div>
  ),
  component: CampaignLanding,
});

function CampaignLanding() {
  const c = Route.useLoaderData() as any;

  // Fire-and-forget impression beacon
  useEffect(() => {
    fetch(`/api/public/campaign/${encodeURIComponent(c.landing_slug)}/view`, { method: "POST", keepalive: true }).catch(() => {});
  }, [c.landing_slug]);

  switch (c.landing_template) {
    case "bold":
      return <BoldTemplate c={c} />;
    case "minimal":
      return <MinimalTemplate c={c} />;
    case "classic":
    default:
      return <ClassicTemplate c={c} />;
  }
}

/* ─────────── TEMPLATES ─────────── */

function ClassicTemplate({ c }: { c: any }) {
  return (
    <div className="min-h-screen bg-tint/30">
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="font-display text-lg font-bold tracking-tight">Modern Multi Services</Link>
          <Link to="/fleet" className="text-xs text-white/70 hover:text-cyan">Browse fleet →</Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy to-cyan/40 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-cyan px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-navy">
              <Sparkles className="h-3 w-3" /> Limited offer
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight md:text-6xl">{c.headline || c.name}</h1>
            {c.body && <p className="mt-5 max-w-xl text-lg text-white/80 whitespace-pre-line">{c.body}</p>}
            <Link to="/fleet" className="mt-8 inline-flex items-center gap-2 rounded-full bg-cyan px-7 py-3.5 text-sm font-bold text-navy shadow-elegant transition hover:shadow-2xl">
              {c.call_to_action || "Book now"} <ArrowRight className="h-4 w-4" />
            </Link>
            {c.end_date && <p className="mt-4 text-xs text-white/60">Offer valid until {new Date(c.end_date).toLocaleDateString()}</p>}
          </div>
          {c.creative_url ? (
            <div className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
              <img src={c.creative_url} alt="" className="h-full w-full object-cover" />
            </div>
          ) : null}
        </div>
      </section>

      <section className="bg-card py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-3">
          {[
            { t: "Shari'a-compliant", d: "No interest, no hidden fees." },
            { t: "24/7 support", d: "Reach our team any time on 3032." },
            { t: "Airport delivery", d: "Free pickup at Egal Intl on arrival." },
          ].map((it) => (
            <div key={it.t} className="rounded-2xl border border-border p-6">
              <CheckCircle2 className="h-6 w-6 text-cyan" />
              <p className="mt-3 font-display text-lg font-bold text-navy">{it.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{it.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-white/60">
          © {new Date().getFullYear()} Modern Multi Services · Hargeisa, Somaliland
        </div>
      </footer>
    </div>
  );
}

function BoldTemplate({ c }: { c: any }) {
  return (
    <div className="min-h-screen bg-navy text-white">
      <div className="relative min-h-screen overflow-hidden">
        {c.creative_url && (
          <img src={c.creative_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-tr from-navy via-navy/80 to-transparent" />
        <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-20">
          <span className="inline-flex w-fit items-center gap-1 rounded-full border border-cyan px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-cyan">
            <Globe className="h-3 w-3" /> {c.channel || "Digital exclusive"}
          </span>
          <h1 className="mt-6 font-display text-5xl font-black leading-[0.95] md:text-8xl">
            {c.headline || c.name}
          </h1>
          {c.body && <p className="mt-8 max-w-2xl text-xl text-white/80 whitespace-pre-line">{c.body}</p>}
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/fleet" className="inline-flex items-center gap-2 rounded-none bg-cyan px-8 py-4 text-sm font-black uppercase tracking-widest text-navy hover:bg-white">
              {c.call_to_action || "Get started"} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-none border border-white/30 px-8 py-4 text-sm font-bold uppercase tracking-widest text-white hover:bg-white/10">
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function MinimalTemplate({ c }: { c: any }) {
  return (
    <div className="min-h-screen bg-white text-navy">
      <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan">{c.channel || "Modern Multi Services"}</p>
        <h1 className="mt-8 font-display text-4xl font-bold leading-tight md:text-6xl">{c.headline || c.name}</h1>
        {c.body && <p className="mt-8 text-lg leading-relaxed text-foreground/70 whitespace-pre-line">{c.body}</p>}
        {c.creative_url && (
          <div className="my-12 overflow-hidden rounded-2xl border border-border">
            <img src={c.creative_url} alt="" className="w-full" />
          </div>
        )}
        <Link to="/fleet" className="inline-flex items-center gap-2 border-b-2 border-navy pb-1 text-base font-semibold hover:border-cyan hover:text-cyan transition">
          {c.call_to_action || "Explore"} <ArrowRight className="h-4 w-4" />
        </Link>
        <div className="mt-24 border-t border-border pt-6 text-xs text-muted-foreground">
          Modern Multi Services · Hargeisa, Somaliland
        </div>
      </div>
    </div>
  );
}