import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  ArrowLeft, ArrowRight, Check, Upload, FileSignature, CreditCard, User,
  CalendarCheck, Wallet, Building2, Smartphone, ShieldCheck, AlertTriangle,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { fleet, priceForDays, MIN_RENTAL_DAYS, tierLabel } from "@/data/fleet";
import { getVehicleBookedRanges } from "@/lib/availability.functions";

const searchSchema = z.object({ days: z.number().min(4).max(60).optional().catch(4) });

export const Route = createFileRoute("/book/$vehicleId")({
  validateSearch: searchSchema,
  head: ({ params }) => {
    const v = fleet.find((x) => x.id === params.vehicleId);
    const url = `https://modern.somalilandsystems.com/book/${params.vehicleId}`;
    const title = v ? `Book ${v.name} ${v.year} — Modern Multi Services` : "Book — Modern Multi Services";
    const description = v
      ? `Book the ${v.name} ${v.year} in Hargeisa with Modern Multi Services. Transparent USD pricing, mobile-money payments and bilingual contracts.`
      : "Book a vehicle with Modern Multi Services in Hargeisa.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { name: "robots", content: "noindex" },
        ...(v ? [{ property: "og:image", content: v.image }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  loader: ({ params }) => {
    const v = fleet.find((x) => x.id === params.vehicleId);
    if (!v) throw notFound();
    return v;
  },
  notFoundComponent: () => (
    <SiteLayout><div className="mx-auto max-w-3xl px-4 py-32 text-center"><h1 className="font-display text-3xl font-bold">Vehicle not found</h1></div></SiteLayout>
  ),
  errorComponent: ({ error }) => (
    <SiteLayout><div className="mx-auto max-w-3xl px-4 py-32 text-center text-destructive">{error.message}</div></SiteLayout>
  ),
  component: BookingWizard,
});

const stepMeta = [
  { n: 1, label: "Vehicle & dates", icon: CalendarCheck },
  { n: 2, label: "Your account", icon: User },
  { n: 3, label: "Documents", icon: Upload },
  { n: 4, label: "Contract", icon: FileSignature },
  { n: 5, label: "Payment", icon: CreditCard },
];

const payMethods = [
  { id: "zaad", name: "Zaad", desc: "Telesom mobile money — instant", icon: Smartphone },
  { id: "edahab", name: "E-dahab", desc: "Somtel mobile money — instant", icon: Smartphone },
  { id: "premier-wallet", name: "Premier Wallet", desc: "Mobile money — instant", icon: Wallet },
  { id: "dahabshiil", name: "Dahabshiil Bank", desc: "Bank transfer — manual confirm", icon: Building2 },
  { id: "darasalaam", name: "Darasalaam Bank", desc: "Bank transfer — manual confirm", icon: Building2 },
  { id: "premier-bank", name: "Premier Bank", desc: "Bank transfer — manual confirm", icon: Building2 },
];

function BookingWizard() {
  const v = Route.useLoaderData();
  const { days: initDays } = Route.useSearch();
  const [step, setStep] = useState(1);
  const [days, setDays] = useState(Math.max(initDays ?? MIN_RENTAL_DAYS, MIN_RENTAL_DAYS));
  const [start, setStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [account, setAccount] = useState({ fullName: "", phone: "", email: "", city: "Hargeisa" });
  const [docs, setDocs] = useState({ id: false, license: false });
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [pay, setPay] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const calc = priceForDays(v, days);
  const end = new Date(new Date(start).getTime() + days * 86400000).toISOString().slice(0, 10);

  const fetchRanges = useServerFn(getVehicleBookedRanges);
  const { data: avail } = useQuery({
    queryKey: ["vehicle-availability", v.name],
    queryFn: () => fetchRanges({ data: { vehicleName: v.name } }),
    staleTime: 60_000,
  });
  const conflict = useMemo(() => {
    const ranges = avail?.ranges ?? [];
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return ranges.find((r) => {
      const rs = new Date(r.start).getTime();
      const re = new Date(r.end).getTime();
      return s <= re && e >= rs;
    }) ?? null;
  }, [avail, start, end]);

  const canNext =
    (step === 1 && days >= MIN_RENTAL_DAYS && !conflict) ||
    (step === 2 && account.fullName && account.phone) ||
    (step === 3 && docs.id && docs.license) ||
    (step === 4 && agreed && signature.length > 2) ||
    step === 5;

  if (done) {
    return (
      <SiteLayout>
        <section className="mx-auto max-w-2xl px-4 py-24 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-cyan text-white shadow-elegant">
            <Check className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold">Booking received</h1>
          <p className="mt-3 text-muted-foreground">
            We've sent a confirmation to <span className="font-semibold text-navy">{account.phone}</span> via SMS and WhatsApp.
            Bring your ID and driver's license when you pick up the {v.name}.
          </p>
          <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-left shadow-card">
            <dl className="space-y-2 text-sm">
              <Row k="Reference" val={`MMS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`} />
              <Row k="Vehicle" val={`${v.name} ${v.year}`} />
              <Row k="Pickup" val={start} />
              <Row k="Return" val={end} />
              <Row k="Total paid" val={`$${calc.total}`} />
              <Row k="Method" val={payMethods.find((p) => p.id === pay)?.name ?? "—"} />
            </dl>
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/dashboard" className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-cyan">Go to dashboard</Link>
            <Link to="/fleet" className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-navy hover:border-cyan">Browse more</Link>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="border-b border-border bg-tint/40 py-8">
        <div className="mx-auto max-w-5xl px-4 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan">Booking · 5 steps</p>
          <h1 className="mt-2 font-display text-2xl font-bold md:text-4xl">Reserve your {v.name}</h1>

          <ol className="mt-6 flex items-center justify-between gap-2 overflow-x-auto">
            {stepMeta.map((s) => {
              const active = step === s.n;
              const completed = step > s.n;
              return (
                <li key={s.n} className="flex flex-1 items-center gap-3">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                    completed ? "bg-cyan text-white" : active ? "bg-navy text-white" : "bg-tint text-navy/50"
                  }`}>
                    {completed ? <Check className="h-4 w-4" /> : s.n}
                  </div>
                  <span className={`hidden text-xs font-medium md:inline ${active ? "text-navy" : "text-muted-foreground"}`}>{s.label}</span>
                  {s.n < 5 && <div className={`hidden h-px flex-1 md:block ${completed ? "bg-cyan" : "bg-border"}`} />}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 md:px-8 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card md:p-10">
            {step === 1 && (
              <div className="space-y-6">
                <Header title="Confirm vehicle & dates" subtitle="Adjust your rental window — the price recalculates instantly." />
                <div className="flex items-center gap-4 rounded-xl border border-border bg-tint/40 p-4">
                  <img src={v.image} alt="" className="h-20 w-28 rounded-lg object-cover" />
                  <div>
                    <p className="font-semibold">{v.name} <span className="text-muted-foreground">· {v.year}</span></p>
                    <p className="text-xs text-muted-foreground">{v.tier} · {v.seats} seats · {v.transmission}</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Pickup date">
                    <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-cyan focus:outline-none" />
                  </Field>
                  <Field label="Return date">
                    <input type="date" value={end} readOnly className="w-full rounded-lg border border-border bg-tint px-3 py-2.5 text-sm text-muted-foreground" />
                  </Field>
                </div>
                <Field label={`Rental length · ${days} day${days > 1 ? "s" : ""}`}>
                  <input type="range" min={1} max={60} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full accent-cyan" />
                </Field>
                {conflict ? (
                  <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Dates not available</p>
                      <p className="mt-0.5 text-xs">This vehicle is already booked from <b>{conflict.start}</b> to <b>{conflict.end}</b>. Pick a different pickup date or shorten the rental.</p>
                    </div>
                  </div>
                ) : avail && avail.ranges.length > 0 ? (
                  <div className="rounded-xl border border-border bg-tint/40 p-4 text-xs text-muted-foreground">
                    <p className="font-semibold text-navy">Upcoming unavailable windows</p>
                    <ul className="mt-1.5 space-y-0.5">
                      {avail.ranges.slice(0, 4).map((r, i) => (
                        <li key={i}>· {r.start} → {r.end}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <Header title="Your account" subtitle="Returning customer? We'll match by phone number." />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name"><Input value={account.fullName} onChange={(v) => setAccount({ ...account, fullName: v })} placeholder="Amiin Cumar" /></Field>
                  <Field label="Phone number"><Input value={account.phone} onChange={(v) => setAccount({ ...account, phone: v })} placeholder="063-4829005" /></Field>
                  <Field label="Email (optional)"><Input value={account.email} onChange={(v) => setAccount({ ...account, email: v })} placeholder="you@example.com" /></Field>
                  <Field label="City"><Input value={account.city} onChange={(v) => setAccount({ ...account, city: v })} /></Field>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <Header title="Documents" subtitle="Upload a clear photo of each — required for the contract." />
                {[
                  { k: "id" as const, l: "National ID or passport" },
                  { k: "license" as const, l: "Driver's license" },
                ].map((d) => (
                  <label key={d.k} className={`flex cursor-pointer items-center justify-between rounded-xl border-2 border-dashed px-5 py-6 transition ${docs[d.k] ? "border-cyan bg-cyan/5" : "border-border hover:border-cyan"}`}>
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-tint text-cyan"><Upload className="h-5 w-5" /></div>
                      <div>
                        <p className="text-sm font-semibold text-navy">{d.l}</p>
                        <p className="text-xs text-muted-foreground">{docs[d.k] ? "Uploaded · tap to replace" : "Tap to upload (JPG / PNG / PDF)"}</p>
                      </div>
                    </div>
                    {docs[d.k] && <Check className="h-5 w-5 text-cyan" />}
                    <input type="file" className="hidden" onChange={(e) => setDocs({ ...docs, [d.k]: !!e.target.files?.length })} accept="image/*,application/pdf" />
                  </label>
                ))}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <Header title="Rental agreement" subtitle="Bilingual — English / Soomaali. Scroll, then sign." />
                <div className="max-h-72 overflow-y-auto rounded-xl border border-border bg-tint/30 p-5 text-sm leading-relaxed text-foreground">
                  <p className="font-semibold text-navy">Heshiis Kala Kireysi Baabuur · Rental Agreement</p>
                  <ul className="mt-3 list-disc space-y-2 pl-5">
                    <li>Full rental amount is payable in advance / Lacagta kirada xaga hore aya laga qadimayaa.</li>
                    <li>Lost items must be reported within 2 hours — beyond that, the company cannot guarantee recovery.</li>
                    <li>Smoking or chewing qaad inside the vehicle incurs a $10 cleaning fee.</li>
                    <li>The vehicle may not leave Hargeisa without written company permission.</li>
                    <li>The renter may not modify or repair the vehicle without notifying the company.</li>
                    <li>The renter may not hand over keys or sublet the vehicle. Doing so voids the deposit.</li>
                    <li>In the event of an accident with another vehicle, the renter is responsible until resolved between the company and the third party.</li>
                    <li>Use of the vehicle for anything contrary to Islamic law or Somaliland law is strictly prohibited.</li>
                    <li>The renter is fully responsible for any loss of life or property caused.</li>
                    <li>In the event of a total loss, the renter is required to replace the vehicle.</li>
                  </ul>
                </div>
                <label className="flex items-start gap-3 text-sm">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4 accent-cyan" />
                  <span>I agree to the terms above and confirm the details I've provided are accurate.</span>
                </label>
                <Field label="Type your full name as e-signature">
                  <Input value={signature} onChange={setSignature} placeholder="Your full legal name" />
                </Field>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <Header title="Payment" subtitle={`Pay ${`$${calc.total}`} in USD — no interest, no hidden fees.`} />
                <div className="grid gap-3 sm:grid-cols-2">
                  {payMethods.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPay(p.id)}
                      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${pay === p.id ? "border-cyan bg-cyan/5 shadow-card" : "border-border hover:border-cyan"}`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tint text-cyan"><p.icon className="h-5 w-5" /></div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-navy">{p.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{p.desc}</p>
                      </div>
                      {pay === p.id && <Check className="h-5 w-5 text-cyan" />}
                    </button>
                  ))}
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-tint/60 p-3 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan" />
                  Payments are processed by the gateway. Mobile money confirms instantly; bank transfers require manual confirmation by our accounting team.
                </div>
              </div>
            )}

            <div className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6">
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-navy transition hover:border-cyan disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              {step < 5 ? (
                <button
                  disabled={!canNext}
                  onClick={() => setStep((s) => s + 1)}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-cyan px-6 py-2.5 text-sm font-semibold text-white shadow-card transition hover:shadow-elegant disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  disabled={!pay}
                  onClick={() => setDone(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-cyan px-6 py-2.5 text-sm font-semibold text-white shadow-card transition hover:shadow-elegant disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Pay ${calc.total} <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Summary */}
          <aside className="rounded-2xl border border-border bg-card p-6 shadow-card lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan">Order summary</p>
            <div className="mt-4 flex items-center gap-3">
              <img src={v.image} alt="" className="h-16 w-20 rounded-md object-cover" />
              <div>
                <p className="text-sm font-semibold">{v.name}</p>
                <p className="text-xs text-muted-foreground">{v.year} · {v.tier}</p>
              </div>
            </div>
            <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
              <Row k="Pickup" val={start} />
              <Row k="Return" val={end} />
              <Row k="Days" val={String(days)} />
              <Row k="Rate band" val={calc.band.label} />
              <Row k="Daily rate" val={`$${calc.perDay}`} />
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="font-display text-lg font-bold text-cyan">${calc.total}</dd>
              </div>
            </dl>
            <p className="mt-4 text-[11px] text-muted-foreground">Transparent pricing — no interest, no hidden charges.</p>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-cyan focus:ring-2 focus:ring-cyan/20" />;
}
function Row({ k, val }: { k: string; val: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium text-navy">{val}</dd>
    </div>
  );
}
