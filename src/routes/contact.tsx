import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Phone, Mail, MessageCircle, MapPin, Clock } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useSetting } from "@/lib/use-settings";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Modern Multi Services" },
      { name: "description", content: "Reach our 24/7 Hargeisa call centre on 3032, message us on WhatsApp, or request a custom quote." },
      { property: "og:title", content: "Contact Modern Multi Services" },
      { property: "og:description", content: "Call 3032, WhatsApp us, or visit the Durdur Building in Hargeisa." },
      { property: "og:url", content: "https://modern.somalilandsystems.com/contact" },
    ],
    links: [
      { rel: "canonical", href: "https://modern.somalilandsystems.com/contact" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "Modern Multi Services",
          url: "https://modern.somalilandsystems.com/contact",
          telephone: "3032",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Durdur Building",
            addressLocality: "Hargeisa",
            addressCountry: "Somaliland",
          },
          openingHours: "Mo-Su 00:00-23:59",
        }),
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  const company = useSetting("company");
  const contact = useSetting("contact");
  const hours = useSetting("hours");
  const waNumber = (contact.whatsapp || "").replace(/\D/g, "");

  return (
    <SiteLayout>
      <section className="bg-gradient-hero py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan">Get in touch</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-white md:text-6xl">We pick up. Every time.</h1>
          <p className="mt-4 max-w-2xl text-white/80 md:text-lg">
            Dial {contact.hotline || company.hotline} from any Somaliland number — or reach us by WhatsApp, email, or in person.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Phone, t: "Call centre", d: `${contact.hotline || company.hotline} — ${hours.callCentre || "24/7"}`, href: `tel:${contact.hotline || company.hotline}` },
              { icon: MessageCircle, t: "WhatsApp", d: "Bookings & quotes", href: waNumber ? `https://wa.me/${waNumber}` : "#" },
              { icon: Mail, t: "Email", d: contact.email || company.email, href: `mailto:${contact.email || company.email}` },
              { icon: MapPin, t: "Visit us", d: company.address, href: "#map" },
            ].map((c) => (
              <a key={c.t} href={c.href} className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-elegant">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-cyan text-white shadow-card">
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-sm font-semibold text-navy">{c.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
            <div className="grid lg:grid-cols-2">
              <div className="bg-gradient-hero p-10 text-white md:p-14">
                <h2 className="font-display text-3xl font-bold text-white md:text-4xl">Send us a message</h2>
                <p className="mt-4 text-white/85">Typical reply time: under one hour during office hours.</p>
                <ul className="mt-10 space-y-5">
                  <li className="flex items-start gap-4">
                    <Clock className="mt-0.5 h-5 w-5 text-cyan" />
                    <div>
                      <p className="text-sm font-semibold">Office hours</p>
                      <p className="text-sm text-white/70">{hours.weekdays}</p>
                      <p className="text-sm text-white/70">{hours.friday}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <MapPin className="mt-0.5 h-5 w-5 text-cyan" />
                    <div>
                      <p className="text-sm font-semibold">{company.address}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <Phone className="mt-0.5 h-5 w-5 text-cyan" />
                    <div>
                      <p className="text-sm font-semibold">Call centre · {contact.hotline || company.hotline}</p>
                      <p className="text-sm text-white/70">{hours.callCentre}</p>
                    </div>
                  </li>
                </ul>
              </div>

              <form
                onSubmit={(e) => { e.preventDefault(); setSent(true); }}
                className="p-10 md:p-14"
              >
                <h3 className="text-2xl font-bold">Request a quote</h3>
                <p className="mt-2 text-sm text-muted-foreground">Tell us what you need — we'll respond within the hour.</p>
                {sent ? (
                  <div className="mt-10 rounded-xl border border-cyan/30 bg-cyan/5 p-6 text-center">
                    <p className="text-base font-semibold text-navy">Thank you — message received.</p>
                    <p className="mt-2 text-sm text-muted-foreground">Our team will reach out by phone or WhatsApp shortly.</p>
                  </div>
                ) : (
                  <div className="mt-8 grid gap-4">
                    <input required placeholder="Full name" className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-cyan focus:ring-2 focus:ring-cyan/20" />
                    <input required placeholder="Phone number" className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-cyan focus:ring-2 focus:ring-cyan/20" />
                    <select className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-cyan focus:ring-2 focus:ring-cyan/20">
                      <option>Preferred category — Luxury Cars</option><option>Mini SUVs</option><option>Sedan Cars</option>
                    </select>
                    <textarea rows={4} placeholder="Dates, pickup location, anything else…" className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-cyan focus:ring-2 focus:ring-cyan/20" />
                    <button type="submit" className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-cyan px-6 py-3.5 text-sm font-semibold text-white shadow-card transition hover:shadow-elegant">
                      Send request <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      <section id="map" className="pb-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="overflow-hidden rounded-3xl border border-border shadow-card">
            <iframe
              title="Modern Multi Services on the map"
              src={contact.mapUrl || "https://www.google.com/maps?q=Hargeisa,Somaliland&output=embed"}
              className="h-[420px] w-full"
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
