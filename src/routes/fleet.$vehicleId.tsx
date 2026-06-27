import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight, Users, Fuel, Cog, Calendar, Check, Crown, Car, Briefcase,
  ChevronLeft, CheckCircle2, CircleSlash, Shield, Phone, MapPin, Clock,
  CreditCard, BadgeCheck, Sparkles,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { fleet, priceForDays, startingPrice, tierColors, tierLabel, MIN_RENTAL_DAYS, type Tier, type Vehicle } from "@/data/fleet";
import { InlineBookingDrawer } from "@/components/booking/InlineBookingDrawer";

export const Route = createFileRoute("/fleet/$vehicleId")({
  head: ({ params }) => {
    const v = fleet.find((x) => x.id === params.vehicleId);
    const url = `https://modern.somalilandsystems.com/fleet/${params.vehicleId}`;
    const title = v ? `${v.name} ${v.year} — Modern Multi Services` : "Vehicle — Modern Multi Services";
    const description = v ? `Rent the ${v.name} ${v.year} in Hargeisa. ${v.description}`.slice(0, 300) : "Vehicle details.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "product" },
        ...(v ? [{ property: "og:image", content: v.image }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: v
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Car",
                name: `${v.name} ${v.year}`,
                image: v.image,
                description: v.description,
                brand: v.name.split(" ")[0],
                vehicleModelDate: String(v.year),
                offers: {
                  "@type": "Offer",
                  priceCurrency: "USD",
                  price: v.pricing[v.pricing.length - 1].pricePerDay,
                  availability: v.available
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                  url,
                },
              }),
            },
          ]
        : undefined,
    };
  },
  loader: ({ params }) => {
    const v = fleet.find((x) => x.id === params.vehicleId);
    if (!v) throw notFound();
    return v;
  },
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <h1 className="font-display text-3xl font-bold">Vehicle not found</h1>
        <Link to="/fleet" className="mt-6 inline-flex text-cyan hover:underline">Back to fleet</Link>
      </div>
    </SiteLayout>
  ),
  errorComponent: ({ error }) => (
    <SiteLayout><div className="mx-auto max-w-3xl px-4 py-32 text-center text-destructive">{error.message}</div></SiteLayout>
  ),
  component: VehicleDetail,
});

const tierIcons: Record<Tier, typeof Crown> = { Luxury: Crown, "Mini SUV": Car, Sedan: Briefcase };

function VehicleDetail() {
  const v = Route.useLoaderData() as Vehicle;
  const [days, setDays] = useState(MIN_RENTAL_DAYS);
  const [bookingOpen, setBookingOpen] = useState(false);
  const calc = useMemo(() => priceForDays(v, days), [v, days]);
  const Icon = tierIcons[v.tier];
  const related = useMemo(
    () => fleet.filter((x) => x.tier === v.tier && x.id !== v.id).slice(0, 3),
    [v.id, v.tier],
  );
  const savings = v.pricing[0].pricePerDay - v.pricing[v.pricing.length - 1].pricePerDay;

  return (
    <SiteLayout>
      <section className="border-b border-border bg-tint/40 py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 text-xs text-muted-foreground md:px-8">
          <Link to="/" className="hover:text-cyan">Home</Link>
          <span>/</span>
          <Link to="/fleet" className="inline-flex items-center gap-1 hover:text-cyan">
            <ChevronLeft className="h-3 w-3" /> Fleet
          </Link>
          <span>/</span>
          <span className="font-medium text-navy">{v.name} {v.year}</span>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${tierColors[v.tier]} px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-card`}>
                  <Icon className="h-3 w-3" />{tierLabel[v.tier]}
                </div>
                {v.available ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" /> Available now
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-destructive">
                    <CircleSlash className="h-3 w-3" /> Currently fully booked
                  </span>
                )}
              </div>
              <h1 className="mt-4 font-display text-3xl font-bold md:text-5xl">{v.name} <span className="text-midblue">{v.year}</span></h1>
              <p className="mt-3 max-w-xl text-muted-foreground md:text-lg">{v.description}</p>

              {/* Hero image */}
              <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-white shadow-card">
                <img src={v.image} alt={`${v.name} ${v.year} in white`} className="aspect-[16/10] w-full object-contain" width={1200} height={750} />
              </div>

              {/* Fleet stock band */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-tint/50 p-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-cyan" />
                  <p className="text-sm text-navy">
                    We operate <strong className="font-semibold">{v.inventory} {v.name}</strong> in our Hargeisa fleet.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {v.available
                    ? "Reserve early — popular dates fill up quickly."
                    : "All units are out on rental. Call 3032 and we'll suggest the closest match."}
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { icon: Users, l: "Seats", v: v.seats },
                  { icon: Cog, l: "Transmission", v: v.transmission },
                  { icon: Fuel, l: "Fuel", v: v.fuel },
                  { icon: Car, l: "Body", v: v.type },
                ].map((d) => (
                  <div key={d.l} className="rounded-xl border border-border bg-card p-4 text-center">
                    <d.icon className="mx-auto h-5 w-5 text-cyan" />
                    <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">{d.l}</p>
                    <p className="mt-0.5 text-sm font-semibold text-navy">{d.v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <h2 className="text-xl font-semibold">Features</h2>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {v.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-cyan" /> {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10">
                <h2 className="text-xl font-semibold">Transparent pricing</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  USD per day. Rent longer and save up to <strong className="text-cyan">${savings}/day</strong> automatically — no negotiation required.
                </p>
                <div className="mt-4 overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-tint text-navy">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Duration</th>
                        <th className="px-4 py-3 text-right font-semibold">Price / day</th>
                      </tr>
                    </thead>
                    <tbody>
                      {v.pricing.map((p) => (
                        <tr key={p.label} className={`border-t border-border ${calc.band.label === p.label ? "bg-cyan/10" : ""}`}>
                          <td className="px-4 py-3">{p.label}</td>
                          <td className="px-4 py-3 text-right font-semibold text-navy">${p.pricePerDay}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* What's included */}
              <div className="mt-10">
                <h2 className="text-xl font-semibold">What's included in every rental</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: Shield, t: "Comprehensive insurance", d: "Third-party and collision cover included as standard." },
                    { icon: Phone, t: "24/7 roadside assistance", d: "One call to 3032 — anywhere in Somaliland." },
                    { icon: MapPin, t: "Hargeisa airport delivery", d: "We'll meet you at Egal International on arrival." },
                    { icon: Clock, t: "Flexible pick-up & drop-off", d: "Office, hotel or airport — your choice." },
                  ].map((it) => (
                    <div key={it.t} className="flex gap-3 rounded-xl border border-border bg-card p-4">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan/10 text-cyan">
                        <it.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-navy">{it.t}</p>
                        <p className="text-xs text-muted-foreground">{it.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div className="mt-10 rounded-2xl border border-border bg-tint/40 p-6">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-cyan" />
                  <h2 className="text-lg font-semibold">Rental requirements</h2>
                </div>
                <ul className="mt-3 grid gap-2 text-sm text-foreground sm:grid-cols-2">
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-cyan" /> Valid driving licence (Somaliland or international)</li>
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-cyan" /> National ID or passport copy</li>
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-cyan" /> Minimum driver age: 22 years</li>
                  <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-cyan" /> Refundable security deposit at pick-up</li>
                </ul>
                <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <CreditCard className="h-3.5 w-3.5" /> We accept Zaad, E-dahab, USD cash and bank transfer.
                </p>
              </div>
            </div>

            {/* Booking card */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elegant lg:max-w-sm lg:ml-auto">
                <div className="bg-gradient-hero px-4 py-3 text-white">
                  <p className="text-[10px] uppercase tracking-widest text-white/70">Estimate</p>
                  <p className="mt-0.5 font-display text-2xl font-bold leading-none">${calc.total}</p>
                  <p className="mt-1 text-xs text-white/80">${calc.perDay}/day · {days} day{days > 1 ? "s" : ""}</p>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Calendar className="h-3 w-3" /> Rental length
                    </label>
                    <input type="range" min={MIN_RENTAL_DAYS} max={45} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full accent-cyan" />
                    <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                      <span>{MIN_RENTAL_DAYS} days</span><span className="font-semibold text-navy">{days} days</span><span>45 days</span>
                    </div>
                  </div>

                  <dl className="space-y-1.5 border-t border-border pt-3 text-xs">
                    <div className="flex justify-between"><dt className="text-muted-foreground">Rate band</dt><dd className="font-medium text-navy">{calc.band.label}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Daily rate</dt><dd className="font-medium text-navy">${calc.perDay}</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Days</dt><dd className="font-medium text-navy">{days}</dd></div>
                    <div className="flex justify-between border-t border-border pt-1.5 text-sm"><dt className="font-semibold">Total</dt><dd className="font-display text-base font-bold text-cyan">${calc.total}</dd></div>
                  </dl>

                  {v.available ? (
                    <button
                      onClick={() => setBookingOpen(true)}
                      className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-cyan px-4 py-2.5 text-xs font-semibold text-white shadow-card transition hover:shadow-elegant"
                    >
                      Reserve in 3 steps
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-center text-xs text-destructive">
                        All {v.inventory} {v.name} are currently out on rental.
                      </div>
                      <a href="tel:3032" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-cyan">
                        <Phone className="h-3.5 w-3.5" /> Call 3032 for alternatives
                      </a>
                    </div>
                  )}
                  <p className="text-center text-[10px] text-muted-foreground">No interest charges · Shari'a-compliant pricing</p>
                </div>
              </div>

              {/* Trust ribbon */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-center text-[11px] text-muted-foreground">
                <div className="rounded-lg border border-border bg-card p-3">
                  <Phone className="mx-auto h-4 w-4 text-cyan" />
                  <p className="mt-1 font-medium text-navy">24/7 support</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <BadgeCheck className="mx-auto h-4 w-4 text-cyan" />
                  <p className="mt-1 font-medium text-navy">No hidden fees</p>
                </div>
              </div>
            </aside>
          </div>

          {/* Related vehicles */}
          {related.length > 0 && (
            <div className="mt-20">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-cyan">You might also like</p>
                  <h2 className="mt-2 font-display text-2xl font-bold md:text-3xl">More {tierLabel[v.tier]}</h2>
                </div>
                <Link to="/fleet" className="hidden text-sm font-medium text-midblue hover:text-cyan sm:inline-flex">View all →</Link>
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => {
                  const RIcon = tierIcons[r.tier];
                  return (
                    <Link key={r.id} to="/fleet/$vehicleId" params={{ vehicleId: r.id }} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-1 hover:shadow-elegant">
                      <div className="aspect-[4/3] overflow-hidden bg-white">
                        <img src={r.image} alt={`${r.name} ${r.year}`} loading="lazy" className="h-full w-full object-contain transition duration-500 group-hover:scale-105" />
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <span className={`inline-flex w-fit items-center gap-1 rounded-full bg-gradient-to-r ${tierColors[r.tier]} px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white`}>
                          <RIcon className="h-3 w-3" />{tierLabel[r.tier]}
                        </span>
                        <h3 className="mt-2 font-semibold">{r.name} <span className="text-muted-foreground">{r.year}</span></h3>
                        <div className="mt-auto flex items-end justify-between pt-4">
                          <p className="font-display text-xl font-bold text-navy">${startingPrice(r)}<span className="text-xs font-medium text-muted-foreground">/day</span></p>
                          <span className="text-xs font-semibold text-cyan group-hover:underline">View →</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <InlineBookingDrawer
        vehicle={v}
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        initialDays={days}
      />

      {/* Mobile sticky CTA */}
      {v.available && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 shadow-elegant backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">From</p>
              <p className="font-display text-lg font-bold text-navy">${calc.perDay}<span className="text-xs font-medium text-muted-foreground">/day</span></p>
            </div>
            <button
              onClick={() => setBookingOpen(true)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-cyan px-5 py-3 text-sm font-semibold text-white shadow-card"
            >
              Reserve now <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
