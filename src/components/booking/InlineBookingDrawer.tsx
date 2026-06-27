import { useEffect, useState } from "react";
import {
  X, ArrowLeft, ArrowRight, Check, CalendarCheck, User, CreditCard,
  Smartphone, Wallet, Building2, ShieldCheck, Sparkles, MapPin, Phone,
  Copy, Share2, FileText, Upload, Camera, IdCard, Loader2, Download,
} from "lucide-react";
import { priceForDays, MIN_RENTAL_DAYS, type Vehicle } from "@/data/fleet";
import { generateAgreementPdf } from "@/lib/agreement-pdf";
import { useServerFn } from "@tanstack/react-start";
import { submitOnlineBooking } from "@/lib/onlineBooking.functions";

type Props = {
  vehicle: Vehicle;
  open: boolean;
  onClose: () => void;
  initialDays?: number;
};

const payMethods = [
  { id: "zaad",          name: "Zaad",           desc: "Telesom mobile money · instant",  icon: Smartphone, badge: "Most popular" },
  { id: "edahab",        name: "E-dahab",        desc: "Somtel mobile money · instant",   icon: Smartphone, badge: null },
  { id: "premier-wallet",name: "Premier Wallet", desc: "Mobile money · instant",          icon: Wallet,     badge: null },
  { id: "dahabshiil",    name: "Dahabshiil Bank",desc: "Bank transfer · manual confirm",  icon: Building2,  badge: null },
  { id: "premier-bank",  name: "Premier Bank",   desc: "Bank transfer · manual confirm",  icon: Building2,  badge: null },
  { id: "darasalaam",    name: "Darasalaam Bank",desc: "Bank transfer · manual confirm",  icon: Building2,  badge: null },
] as const;

const stepDefs = [
  { n: 1, label: "Trip",     icon: CalendarCheck },
  { n: 2, label: "Details",  icon: User },
  { n: 3, label: "Documents",icon: FileText },
  { n: 4, label: "Payment",  icon: CreditCard },
];

const pickupSpots = [
  { id: "office",  label: "Our office",          sub: "Durdur Building, Caro Edeg" },
  { id: "airport", label: "Egal Intl. Airport",  sub: "Meet & greet on arrival"  },
  { id: "hotel",   label: "My hotel / address",  sub: "Free inside Hargeisa"     },
];

export function InlineBookingDrawer({ vehicle, open, onClose, initialDays }: Props) {
  const [step, setStep]       = useState(1);
  const [days, setDays]       = useState(Math.max(initialDays ?? MIN_RENTAL_DAYS, MIN_RENTAL_DAYS));
  const [start, setStart]     = useState(() => new Date().toISOString().slice(0, 10));
  const [pickup, setPickup]   = useState("office");
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");
  const [email, setEmail]     = useState("");
  const [agreed, setAgreed]   = useState(false);
  const [pay, setPay]         = useState<string | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [idFile, setIdFile]           = useState<File | null>(null);
  const [photoFile, setPhotoFile]     = useState<File | null>(null);
  const [done, setDone]       = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [ref, setRef]         = useState("");
  const [payState, setPayState] = useState<"idle" | "ussd" | "confirming" | "success">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitOnline = useServerFn(submitOnlineBooking);

  const calc = priceForDays(vehicle, days);
  const end  = new Date(new Date(start).getTime() + days * 86400000).toISOString().slice(0, 10);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  // Reset on close
  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      setStep(1); setDone(false); setDownloaded(false); setPay(null); setAgreed(false);
      setName(""); setPhone(""); setEmail("");
      setLicenseFile(null); setIdFile(null); setPhotoFile(null);
      setPayState("idle");
    }, 300);
    return () => clearTimeout(t);
  }, [open]);

  // Sync days from parent every time the drawer opens (keeps detail-page slider in sync)
  useEffect(() => {
    if (open && initialDays != null) {
      setDays(Math.max(initialDays, MIN_RENTAL_DAYS));
    }
  }, [open, initialDays]);

  const canNext =
    (step === 1 && days >= MIN_RENTAL_DAYS) ||
    (step === 2 && name.trim().length > 1 && phone.trim().length > 5 && agreed) ||
    (step === 3 && !!licenseFile && !!idFile) ||
    step === 4;

  const submit = async () => {
    setSubmitError(null);
    setPayState("ussd");
    try {
      // Show USSD push UX while we persist the booking
      const persistPromise = submitOnline({
        data: {
          vehicleName: vehicle.name,
          vehicleYear: vehicle.year,
          startDate: start,
          endDate: end,
          days,
          dailyRate: calc.perDay,
          total: calc.total,
          pickupLocation: pickupSpots.find((s) => s.id === pickup)?.label ?? pickup,
          customer: { fullName: name, phone, email },
          paymentMethod: pay ?? "zaad",
        },
      });
      await new Promise((r) => setTimeout(r, 2500));
      setPayState("confirming");
      const result = await persistPromise;
      setRef(result.reference);
      await new Promise((r) => setTimeout(r, 1200));
      setPayState("success");
      setDone(true);
    } catch (err) {
      console.error("Online booking failed:", err);
      setSubmitError(err instanceof Error ? err.message : "Could not submit your booking. Please try again or call 3032.");
      setPayState("idle");
    }
  };

  const downloadPdf = () => {
    const methodName = payMethods.find((p) => p.id === pay)?.name ?? "—";
    const pickupLabel = pickupSpots.find((s) => s.id === pickup)?.label ?? pickup;
    generateAgreementPdf({
      ref, vehicleName: vehicle.name, vehicleYear: vehicle.year,
      start, end, days, perDay: calc.perDay, total: calc.total,
      customerName: name, phone, email, pickup: pickupLabel,
      paymentMethod: methodName,
    });
    setDownloaded(true);
  };

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-[60] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-navy/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Book ${vehicle.name}`}
        className={`absolute inset-y-0 right-0 flex h-full w-full max-w-xl flex-col bg-background shadow-elegant transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="relative flex-shrink-0 overflow-hidden bg-gradient-hero px-6 py-5 text-white">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, oklch(0.72 0.16 230 / 0.6), transparent 50%)" }} />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan">
                {done ? "Confirmed" : `Step ${step} of 4 · ${stepDefs[step - 1].label}`}
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold leading-tight">
                {done ? "You're all set." : `Reserve your ${vehicle.name}`}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close booking"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!done && (
            <div className="relative mt-5 flex items-center gap-2">
              {stepDefs.map((s, i) => {
                const active = step === s.n;
                const completed = step > s.n;
                return (
                  <div key={s.n} className="flex flex-1 items-center gap-2">
                    <div className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-full text-[11px] font-bold transition ${
                      completed ? "bg-cyan text-white" : active ? "bg-white text-navy" : "bg-white/15 text-white/70"
                    }`}>
                      {completed ? <Check className="h-3.5 w-3.5" /> : s.n}
                    </div>
                    {i < stepDefs.length - 1 && (
                      <div className={`h-px flex-1 ${completed ? "bg-cyan" : "bg-white/20"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Body (scroll) */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {payState === "ussd" || payState === "confirming" ? (
            <UssdWaitingView state={payState} phone={phone} method={payMethods.find((p) => p.id === pay)?.name ?? ""} total={calc.total} />
          ) : done ? (
            <SuccessView vehicle={vehicle} ref_={ref} start={start} end={end} total={calc.total} pay={pay} phone={phone} onDownload={downloadPdf} />
          ) : (
            <>
              {/* Mini vehicle card always visible */}
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <img src={vehicle.image} alt="" className="h-14 w-20 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-navy">{vehicle.name}</p>
                  <p className="text-[11px] text-muted-foreground">{vehicle.year} · {vehicle.tier} · {vehicle.transmission}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">From</p>
                  <p className="font-display text-base font-bold text-navy">${calc.perDay}<span className="text-[10px] font-medium text-muted-foreground">/d</span></p>
                </div>
              </div>

              {step === 1 && (
                <div className="mt-6 space-y-5 animate-[fadeUp_0.4s_ease]">
                  <Field label="Pickup date">
                    <input type="date" value={start} min={new Date().toISOString().slice(0,10)} onChange={(e) => setStart(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20" />
                  </Field>

                  <Field label={`Rental length · ${days} day${days > 1 ? "s" : ""}`}>
                    <div className="rounded-xl border border-border bg-tint/40 p-4">
                      <input type="range" min={MIN_RENTAL_DAYS} max={45} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full accent-cyan" />
                      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                        <span>{MIN_RENTAL_DAYS}d</span>
                        <span className="font-semibold text-navy">Return · {end}</span>
                        <span>45d</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {[4, 7, 14, 30].map((d) => (
                          <button key={d} onClick={() => setDays(d)} className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${days === d ? "border-cyan bg-cyan text-white" : "border-border text-navy hover:border-cyan"}`}>
                            {d} days
                          </button>
                        ))}
                      </div>
                    </div>
                  </Field>

                  <Field label="Where should we deliver?">
                    <div className="grid gap-2">
                      {pickupSpots.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setPickup(s.id)}
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${pickup === s.id ? "border-cyan bg-cyan/5" : "border-border hover:border-cyan/50"}`}
                        >
                          <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-tint text-cyan">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-navy">{s.label}</p>
                            <p className="text-[11px] text-muted-foreground">{s.sub}</p>
                          </div>
                          {pickup === s.id && <Check className="h-4 w-4 text-cyan" />}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <div className="flex items-start gap-2 rounded-lg bg-tint/60 p-3 text-[11px] text-muted-foreground">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-cyan" />
                    Daily rate drops automatically at 5, 10 and 30 days — no negotiation needed.
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="mt-6 space-y-5 animate-[fadeUp_0.4s_ease]">
                  <Field label="Full name"><Input value={name} onChange={setName} placeholder="Amiin Cumar" /></Field>
                  <Field label="Phone number"><Input value={phone} onChange={setPhone} placeholder="063-4829005" /></Field>
                  <Field label="Email (optional)"><Input value={email} onChange={setEmail} placeholder="you@example.com" /></Field>

                  <label className="flex items-start gap-2.5 rounded-xl border border-border bg-tint/40 p-3 text-xs text-foreground">
                    <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-cyan" />
                    <span>
                      I agree to the bilingual rental terms — valid driving licence (≥ 6 months), ID & refundable deposit at pickup.
                    </span>
                  </label>
                </div>
              )}

              {step === 3 && (
                <div className="mt-6 space-y-5 animate-[fadeUp_0.4s_ease]">
                  <div className="flex items-start gap-2 rounded-lg bg-tint/60 p-3 text-[11px] text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-cyan" />
                    Upload clear photos of your documents. Required for compliance — files are encrypted and only used to verify your rental.
                  </div>

                  <UploadField
                    label="Driving licence"
                    sub="Required · valid for at least 6 months"
                    required
                    icon={IdCard}
                    file={licenseFile}
                    onChange={setLicenseFile}
                  />
                  <UploadField
                    label="National ID or Passport"
                    sub="Required · front side, clearly readable"
                    required
                    icon={FileText}
                    file={idFile}
                    onChange={setIdFile}
                  />
                  <UploadField
                    label="Selfie / customer photo"
                    sub="Optional · helps speed up pickup"
                    icon={Camera}
                    file={photoFile}
                    onChange={setPhotoFile}
                  />
                </div>
              )}

              {step === 4 && (
                <div className="mt-6 space-y-5 animate-[fadeUp_0.4s_ease]">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total due now</p>
                    <p className="mt-1 font-display text-3xl font-bold text-navy">${calc.total}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">${calc.perDay}/day × {days} days · {calc.band.label}</p>
                  </div>
                  <Field label="Payment method">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {payMethods.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setPay(p.id)}
                          className={`relative flex items-start gap-3 rounded-xl border p-3 text-left transition ${pay === p.id ? "border-cyan bg-cyan/5 shadow-card" : "border-border hover:border-cyan/50"}`}
                        >
                          <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-tint text-cyan">
                            <p.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-navy">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                          </div>
                          {p.badge && pay !== p.id && (
                            <span className="absolute -top-1.5 right-2 rounded-full bg-gradient-cyan px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white">{p.badge}</span>
                          )}
                          {pay === p.id && <Check className="h-4 w-4 text-cyan" />}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <div className="flex items-start gap-2 rounded-lg bg-tint/60 p-3 text-[11px] text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-cyan" />
                    Shari'a-compliant pricing. Mobile money confirms instantly; bank transfers within 1 business hour.
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer / actions */}
        {!done && payState === "idle" && (
          <div className="flex-shrink-0 border-t border-border bg-card px-6 py-4">
            {submitError && (
              <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {submitError}
              </div>
            )}
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Estimate</span>
              <span className="font-display text-xl font-bold text-navy">${calc.total}<span className="text-xs font-medium text-muted-foreground"> · {days}d</span></span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-navy transition hover:border-cyan disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              {step < 4 ? (
                <button
                  disabled={!canNext}
                  onClick={() => setStep((s) => s + 1)}
                  className="ml-auto inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-cyan px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:shadow-elegant disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  disabled={!pay}
                  onClick={submit}
                  className="ml-auto inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-cyan px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:shadow-elegant disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Confirm & pay ${calc.total} <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {done && (
          <div className="flex-shrink-0 border-t border-border bg-card px-6 py-4">
            <div className="flex gap-2">
              <button onClick={downloadPdf} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-cyan px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:shadow-elegant">
                <Download className="h-4 w-4" /> Download agreement
              </button>
              <button
                onClick={onClose}
                disabled={!downloaded}
                title={!downloaded ? "Please download the agreement first" : undefined}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold text-navy transition hover:border-cyan disabled:cursor-not-allowed disabled:opacity-50"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SuccessView({ vehicle, ref_, start, end, total, pay, phone, onDownload }: { vehicle: Vehicle; ref_: string; start: string; end: string; total: number; pay: string | null; phone: string; onDownload: () => void }) {
  const method = payMethods.find((p) => p.id === pay)?.name ?? "—";
  return (
    <div className="animate-[fadeUp_0.4s_ease]">
      <div className="grid place-items-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-cyan text-white shadow-elegant">
          <Check className="h-8 w-8" />
        </div>
      </div>
      <h3 className="mt-4 text-center font-display text-xl font-bold text-navy">Payment successful</h3>
      <p className="mt-1.5 text-center text-sm text-muted-foreground">
        Confirmation sent to <span className="font-semibold text-navy">{phone || "your phone"}</span> via SMS & WhatsApp.
      </p>
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
        <span>
          Your reservation is <strong>pending approval</strong> by our operations team (within 1 business hour).
          If we cannot fulfil it, <strong>100% of your money is refunded</strong> — no deductions.
        </span>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border bg-tint/50 px-4 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Reference</p>
            <p className="font-mono text-sm font-bold text-navy">{ref_}</p>
          </div>
          <button
            onClick={() => navigator.clipboard?.writeText(ref_)}
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-navy transition hover:border-cyan"
          >
            <Copy className="h-3 w-3" /> Copy
          </button>
        </div>
        <dl className="divide-y divide-border text-sm">
          <Row k="Vehicle" v={`${vehicle.name} ${vehicle.year}`} />
          <Row k="Pickup"  v={start} />
          <Row k="Return"  v={end} />
          <Row k="Method"  v={method} />
          <div className="flex justify-between px-4 py-3">
            <dt className="font-semibold">Total paid</dt>
            <dd className="font-display text-lg font-bold text-cyan">${total}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button onClick={onDownload} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-cyan bg-cyan/5 px-4 py-2.5 text-xs font-semibold text-navy transition hover:bg-cyan/10">
          <Download className="h-3.5 w-3.5" /> Agreement PDF
        </button>
        <a href="tel:3032" className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-xs font-semibold text-navy transition hover:border-cyan">
          <Phone className="h-3.5 w-3.5" /> Call 3032
        </a>
      </div>
      <button
        onClick={() => navigator.share?.({ title: `Booking ${ref_}`, text: `My ${vehicle.name} rental — ref ${ref_}` }).catch(() => {})}
        className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-xs font-semibold text-navy transition hover:border-cyan"
      >
        <Share2 className="h-3.5 w-3.5" /> Share booking
      </button>
    </div>
  );
}

function UssdWaitingView({ state, phone, method, total }: { state: "ussd" | "confirming"; phone: string; method: string; total: number }) {
  const confirming = state === "confirming";
  return (
    <div className="flex flex-col items-center py-6 text-center animate-[fadeUp_0.4s_ease]">
      <div className="relative grid h-24 w-24 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-cyan/30" />
        <span className="absolute inset-2 rounded-full bg-cyan/20" />
        <div className="relative grid h-16 w-16 place-items-center rounded-full bg-gradient-cyan text-white shadow-elegant">
          {confirming ? <Check className="h-8 w-8" /> : <Smartphone className="h-7 w-7" />}
        </div>
      </div>
      <h3 className="mt-6 font-display text-xl font-bold text-navy">
        {confirming ? "PIN accepted — finalising…" : `Check your phone for the ${method} pop-up`}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {confirming
          ? "We received your confirmation. Securing the reservation and generating your agreement now."
          : `A USSD session was pushed to ${phone || "your phone"}. Enter your PIN to authorise the payment of $${total}.`}
      </p>

      <div className="mt-6 w-full max-w-xs rounded-2xl border border-border bg-card p-4 text-left shadow-card">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Live status</p>
        <ul className="mt-3 space-y-2.5 text-sm">
          <StatusRow done label="Booking details captured" />
          <StatusRow done label={`USSD push sent to ${phone || "phone"}`} />
          <StatusRow done={confirming} loading={!confirming} label={confirming ? "PIN confirmed by customer" : "Waiting for PIN confirmation…"} />
          <StatusRow done={false} loading={confirming} label={confirming ? "Posting payment to MMS account" : "Posting payment"} />
        </ul>
      </div>

      <div className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan" />
        Do not close this window
      </div>
    </div>
  );
}

function StatusRow({ done, loading, label }: { done: boolean; loading?: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className={`grid h-5 w-5 flex-shrink-0 place-items-center rounded-full ${done ? "bg-cyan text-white" : loading ? "bg-cyan/15 text-cyan" : "bg-muted text-muted-foreground"}`}>
        {done ? <Check className="h-3 w-3" /> : loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      </span>
      <span className={done ? "text-navy font-medium" : loading ? "text-navy" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-cyan focus:ring-2 focus:ring-cyan/20"
    />
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between px-4 py-2.5">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium text-navy">{v}</dd>
    </div>
  );
}

function UploadField({
  label, sub, icon: Icon, file, onChange, required,
}: {
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  file: File | null;
  onChange: (f: File | null) => void;
  required?: boolean;
}) {
  const inputId = `upload-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <label htmlFor={inputId} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-3 transition ${file ? "border-cyan bg-cyan/5" : "border-border hover:border-cyan/60 hover:bg-tint/40"}`}>
        <div className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg ${file ? "bg-cyan text-white" : "bg-tint text-cyan"}`}>
          {file ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-navy">
            {label}
            {required && <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-destructive">Required</span>}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB` : sub}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {file && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onChange(null); }}
              className="rounded-full border border-border px-2 py-1 text-[10px] font-medium text-navy hover:border-destructive hover:text-destructive"
            >
              Remove
            </button>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-navy px-3 py-1.5 text-[10px] font-semibold text-white">
            <Upload className="h-3 w-3" /> {file ? "Replace" : "Upload"}
          </span>
        </div>
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*,application/pdf"
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}