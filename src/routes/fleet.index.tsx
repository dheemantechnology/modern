import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Filter, Users, Fuel, Cog, Crown, Car, Briefcase, CheckCircle2, CircleSlash } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { fleet, startingPrice, tierColors, tierLabel, type Tier } from "@/data/fleet";
import { useFleetIndexContent } from "@/lib/cms/use-cms";

export const Route = createFileRoute("/fleet/")({
  head: () => ({
    meta: [
      { title: "Fleet — Modern Multi Services" },
      { name: "description", content: "Browse our Somaliland fleet: Luxury Land Cruisers, Mini SUVs and Sedan cars. Transparent USD pricing from $19/day. Minimum 4-day rental." },
      { property: "og:title", content: "Our Fleet — Modern Multi Services" },
      { property: "og:description", content: "Luxury, Mini SUV and Sedan rentals across Hargeisa." },
      { property: "og:url", content: "https://modern.somalilandsystems.com/fleet" },
    ],
    links: [
      { rel: "canonical", href: "https://modern.somalilandsystems.com/fleet" },
    ],
  }),
  component: FleetPage,
});

const tierIcons: Record<Tier, typeof Crown> = { Luxury: Crown, "Mini SUV": Car, Sedan: Briefcase };
const tiers: ("All" | Tier)[] = ["All", "Luxury", "Mini SUV", "Sedan"];

function FleetPage() {
  const C = useFleetIndexContent();
  const [tier, setTier] = useState<"All" | Tier>("All");
  const [type, setType] = useState<string>("All");
  const [maxPrice, setMaxPrice] = useState<number>(300);
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const types = useMemo(() => ["All", ...Array.from(new Set(fleet.map((v) => v.type)))], []);
  const filtered = fleet.filter(
    (v) =>
      (tier === "All" || v.tier === tier) &&
      (type === "All" || v.type === type) &&
      startingPrice(v) <= maxPrice &&
      (!onlyAvailable || v.available),
  );

  return (
    <SiteLayout>
      <section className="bg-gradient-hero py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan">{C.hero.eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-white md:text-6xl">{C.hero.title}</h1>
          <p className="mt-4 max-w-2xl text-white/80 md:text-lg">{C.hero.body}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          {/* Filters */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card md:p-6">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-navy">
              <Filter className="h-4 w-4 text-cyan" /> Filters
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {tiers.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTier(t)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        tier === t ? "border-cyan bg-cyan text-white" : "border-border text-navy hover:border-cyan"
                      }`}
                    >
                      {t === "All" ? "All" : tierLabel[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-cyan focus:outline-none">
                  {types.map((t) => (<option key={t}>{t}</option>))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Max price / day · ${maxPrice}
                </label>
                <input type="range" min={20} max={300} step={5} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-cyan" />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-navy">
                  <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} className="h-4 w-4 accent-cyan" />
                  Available only
                </label>
              </div>
            </div>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">{filtered.length} vehicle{filtered.length === 1 ? "" : "s"}</p>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((v) => {
              const Icon = tierIcons[v.tier];
              return (
                <article key={v.id} className={`group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-1 hover:shadow-elegant ${!v.available ? "opacity-60" : ""}`}>
                  <div className="relative aspect-[4/3] overflow-hidden bg-tint">
                    <img src={v.image} alt={`${v.name} ${v.year}`} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" width={800} height={512} />
                    <span className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${tierColors[v.tier]} px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-card`}>
                      <Icon className="h-3 w-3" />{tierLabel[v.tier]}
                    </span>
                    {!v.available && (
                      <span className="absolute right-4 top-4 rounded-full bg-destructive px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">Unavailable</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="text-lg font-semibold text-navy">{v.name}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">{v.year} · {v.type}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-tint px-2.5 py-1 text-[11px] font-semibold text-navy">
                        {v.inventory} in our fleet
                      </span>
                      {v.available ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive">
                          <CircleSlash className="h-3 w-3" /> Fully booked
                        </span>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{v.seats}</span>
                      <span className="flex items-center gap-1"><Cog className="h-3.5 w-3.5" />{v.transmission.slice(0, 4)}</span>
                      <span className="flex items-center gap-1"><Fuel className="h-3.5 w-3.5" />{v.fuel}</span>
                    </div>
                    <div className="mt-6 flex items-end justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">From</p>
                        <p className="font-display text-2xl font-bold text-navy">
                          ${startingPrice(v)}<span className="text-sm font-medium text-muted-foreground"> / day</span>
                        </p>
                      </div>
                      <Link to="/fleet/$vehicleId" params={{ vehicleId: v.id }} className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white transition hover:bg-cyan">
                        Details <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              <p className="font-semibold text-navy">{C.emptyState.title}</p>
              <p className="mt-1 text-sm">{C.emptyState.body}</p>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
