// Source-of-truth content for the marketing site. The same shape is
// stored in `cms_pages.sections` and merged on top of these defaults by
// `useCmsContent`. Admins edit it via the Structured CMS editor.

export type HomeContent = {
  hero: {
    slides: { kicker: string; title: string; accent: string; text: string; imageId: string }[];
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };
  trustBadges: { title: string; subtitle: string }[];
  howItWorks: {
    eyebrow: string;
    headingLead: string;
    headingTail: string;
    intro: string;
    steps: { tag: string; title: string; text: string; meta: string }[];
    promiseEyebrow: string;
    promiseText: string;
    promiseCta: string;
  };
  fleetSection: {
    eyebrow: string;
    title: string;
    body: string;
    tiers: { tier: string; tagline: string; bestFor: string }[];
  };
  requirements: {
    eyebrow: string;
    title: string;
    body: string;
    items: { title: string; text: string }[];
  };
  included: {
    eyebrow: string;
    title: string;
    body: string;
    list: string[];
    protections: { title: string; body: string }[];
  };
  pricing: {
    eyebrow: string;
    title: string;
    body: string;
    tiers: { range: string; label: string }[];
    policies: { title: string; body: string }[];
  };
  useCases: {
    eyebrow: string;
    title: string;
    items: { title: string; body: string }[];
  };
  destinations: {
    eyebrow: string;
    title: string;
    body: string;
    items: { name: string; km: string; note: string }[];
  };
  corporate: {
    eyebrow: string;
    title: string;
    body: string;
    bullets: string[];
    ctaLabel: string;
  };
  whyUs: {
    eyebrow: string;
    title: string;
    body: string;
    bullets: string[];
    cards: { title: string; body: string }[];
  };
  testimonials: {
    eyebrow: string;
    title: string;
    items: { name: string; role: string; text: string }[];
    paymentsLabel: string;
    payments: string[];
  };
  faqs: {
    eyebrow: string;
    title: string;
    body: string;
    items: { q: string; a: string }[];
  };
  finalCta: { title: string; body: string };
};

export type AboutContent = {
  hero: { eyebrow: string; title: string; accent: string; subtitle: string; ctaPrimary: string; ctaSecondary: string };
  stats: { value: number; suffix: string; label: string }[];
  founder: { eyebrow: string; title: string; name: string; role: string; initials: string; quote: string; date: string };
  timeline: {
    eyebrow: string;
    title: string;
    items: { year: string; title: string; body: string }[];
  };
  values: {
    eyebrow: string;
    title: string;
    items: { title: string; body: string }[];
  };
  team: {
    eyebrow: string;
    title: string;
    intro: string;
    members: { name: string; role: string; initials: string; hue: string; bio: string }[];
  };
  cta: { title: string; body: string };
};

export const homeDefaults: HomeContent = {
  hero: {
    slides: [
      { kicker: "The Executive Class", title: "Arrive with", accent: "quiet authority.", text: "Chauffeur-grade Land Cruiser V8s, reserved for those who measure a journey in impressions.", imageId: "toyota-v8-2024" },
      { kicker: "Effortless from the first tap", title: "Five steps.", accent: "Keys in thirty minutes.", text: "A bilingual contract, mobile-money payment, and complimentary delivery across Hargeisa.", imageId: "toyota-rav4-2023" },
      { kicker: "A fleet for every occasion", title: "Forty vehicles.", accent: "One standard of care.", text: "From a refined city sedan to an upcountry-ready SUV — every car inspected, insured and impeccably prepared.", imageId: "kia-2020" },
    ],
    primaryCta: { label: "Browse the fleet", href: "/fleet" },
    secondaryCta: { label: "3032", href: "tel:3032" },
  },
  trustBadges: [
    { title: "Fully insured", subtitle: "Every rental" },
    { title: "Free city delivery", subtitle: "Inside Hargeisa" },
    { title: "24/7 support", subtitle: "Dial 3032" },
    { title: "No hidden fees", subtitle: "USD, all-in" },
  ],
  howItWorks: {
    eyebrow: "How it works",
    headingLead: "From browsing to the open road —",
    headingTail: "in three considered steps.",
    intro: "A booking experience engineered for clarity. No phone tag, no paperwork queues — just a quiet, professional handover.",
    steps: [
      { tag: "Discover", title: "Choose your drive.", text: "Forty inspected vehicles across three classes. Filter by category, dates and budget — see live availability and honest, all-inclusive USD pricing.", meta: "Real-time availability" },
      { tag: "Reserve", title: "Confirm in minutes.", text: "A five-step wizard handles your ID, licence and a bilingual contract. Pay with Zaad, E-dahab or bank transfer — your reservation is secured instantly.", meta: "5-step secure booking" },
      { tag: "Drive", title: "Keys, delivered.", text: "Collect at our Hargeisa office or have your car brought to your hotel, office or the airport — at no charge inside the city. On the road in under thirty minutes.", meta: "Free city delivery" },
    ],
    promiseEyebrow: "Our promise",
    promiseText: "From first click to ignition — under thirty minutes.",
    promiseCta: "Begin your booking",
  },
  fleetSection: {
    eyebrow: "The fleet",
    title: "Three categories. One standard of care.",
    body: "Every vehicle is inspected before and after each rental and serviced on a strict schedule. Transparent USD pricing — no hidden fees, no surprise charges.",
    tiers: [
      { tier: "Luxury", tagline: "Land Cruiser V8 · Surf", bestFor: "Diplomats · Executive transfers · Upcountry convoys" },
      { tier: "Mini SUV", tagline: "RAV4 · Harrier · Mazda CX-5", bestFor: "Business travel · Family weekends · City driving" },
      { tier: "Sedan", tagline: "Noah · Kia · Mark II", bestFor: "Daily commuting · Group travel · Budget rentals" },
    ],
  },
  requirements: {
    eyebrow: "Rental requirements",
    title: "What you'll need to rent.",
    body: "Straightforward, transparent and the same for every customer. Upload everything from your phone during checkout — no office visit required.",
    items: [
      { title: "Valid ID", text: "National ID, passport or diplomatic ID. Foreign visitors: passport plus entry visa." },
      { title: "Driving licence", text: "Somaliland, Somali, East African or international driving licence — valid for at least 6 months." },
      { title: "Minimum age 21", text: "Drivers must be 21 or older. Luxury-category rentals (Land Cruiser V8) require a minimum age of 25." },
      { title: "Refundable deposit", text: "A small refundable security deposit secures your booking. Refunded in full on safe vehicle return." },
    ],
  },
  included: {
    eyebrow: "Every rental includes",
    title: "No surprises. No hidden fees.",
    body: "The price you see is the price you pay. Insurance, taxes and roadside support are built in — so you can focus on the trip, not the paperwork.",
    list: [
      "Comprehensive insurance on every rental",
      "24/7 roadside assistance anywhere in Somaliland",
      "Free replacement vehicle if a mechanical issue occurs",
      "Full tank at pickup — return with the same level",
      "Free delivery & collection inside Hargeisa city limits",
      "Bilingual (English / Somali) digital rental contract",
      "VAT and all government fees included in the quoted price",
      "Unlimited mileage on all rentals of 3 days or more",
    ],
    protections: [
      { title: "Comprehensive insurance", body: "Every vehicle is covered for collision, third-party liability and theft. Damage liability is capped — never an open bill." },
      { title: "24/7 roadside assistance", body: "One number, any time. Breakdown, flat tyre, lockout — we dispatch help wherever you are in Somaliland." },
      { title: "Free replacement vehicle", body: "If a mechanical fault is on us, you get an equivalent vehicle delivered to you — no charge, no waiting around." },
      { title: "Pre & post inspection", body: "Every car is photo-inspected at handover and return. You see exactly what's on the record — no surprise charges." },
    ],
  },
  pricing: {
    eyebrow: "Pricing & policies",
    title: "Pay less the longer you drive.",
    body: "Daily rates step down automatically at 5, 10 and 30 days — the longer your rental, the lower your daily price. No negotiation, no fine print.",
    tiers: [
      { range: "1 – 4 days", label: "Daily rate" },
      { range: "5 – 9 days", label: "−10 to 15%" },
      { range: "10 – 29 days", label: "−20 to 30%" },
      { range: "30+ days", label: "Best rate" },
    ],
    policies: [
      { title: "Fuel policy", body: "Full-to-full. We deliver with a full tank — return it the same way." },
      { title: "Mileage", body: "Unlimited kilometres inside Somaliland on rentals of 3 days or more." },
      { title: "Cancellation", body: "Free cancellation up to 24 hours before pickup. Flexible by design." },
    ],
  },
  useCases: {
    eyebrow: "Built for every trip",
    title: "Whatever the road, we have the car.",
    items: [
      { title: "Airport transfers", body: "Executive pickups from Egal International Airport in our Luxury Land Cruiser V8. Meet & greet, name board and luggage handling on request." },
      { title: "Business & corporate", body: "Monthly accounts, dedicated account manager, consolidated invoicing in USD." },
      { title: "Upcountry & tourism", body: "4WD vehicles built for the road to Berbera, Burao, Las Anod and the Laas Geel rock-art site." },
      { title: "Family & group travel", body: "8-seat Noah minivans and 7-seat Land Cruisers — perfect for weddings, events and family weekends." },
    ],
  },
  destinations: {
    eyebrow: "Where you can go",
    title: "Hargeisa is just the start.",
    body: "Our rentals are valid across Somaliland — from the Red Sea coast at Berbera to the ancient Laas Geel rock art and the eastern corridor to Las Anod. Cross-border travel is available with prior written approval.",
    items: [
      { name: "Hargeisa → Berbera", km: "160 km", note: "Coastal escape · Red Sea beaches" },
      { name: "Hargeisa → Laas Geel", km: "55 km", note: "Neolithic cave paintings · 4WD recommended" },
      { name: "Hargeisa → Burao", km: "180 km", note: "Inland trading hub" },
      { name: "Hargeisa → Borama", km: "120 km", note: "Western highlands · University city" },
      { name: "Hargeisa → Las Anod", km: "470 km", note: "Eastern Somaliland · long-distance trip" },
      { name: "Around Hargeisa", km: "City rates", note: "Daily rentals for in-town errands" },
    ],
  },
  corporate: {
    eyebrow: "Corporate & long-term",
    title: "Run your fleet without owning one.",
    body: "NGOs, embassies, contractors and growing businesses across Somaliland rely on our long-term programs for predictable mobility and consolidated billing.",
    bullets: [
      "Monthly billing in USD with consolidated invoices",
      "Dedicated account manager and priority dispatch",
      "Discounted long-term rates from 10 days, deeper discounts from 30 days",
      "Driver-included options for executive transport",
      "Branded vehicles available for events and conferences",
    ],
    ctaLabel: "Talk to a corporate advisor",
  },
  whyUs: {
    eyebrow: "Why Modern Multi Services",
    title: "Built around how Somaliland actually rents cars.",
    body: "Over a decade of refining the operation — from how a Zaad payment confirms a booking, to how a garage quotation reaches your phone. Local know-how, modern technology.",
    bullets: [
      "Pay with Zaad, E-dahab, Premier Wallet or bank transfer — USD prices, always.",
      "Bilingual digital contracts in English and Somali, e-signed on your phone.",
      "Loyalty rewards and referral bonuses for returning customers.",
      "24/7 call centre — dial 3032 from any Somaliland number.",
    ],
    cards: [
      { title: "Mobile money", body: "Zaad & E-dahab push payments confirm bookings instantly." },
      { title: "Fully inspected", body: "Every car checked in and out — documented with photos." },
      { title: "WhatsApp updates", body: "Booking confirmations and reminders on WhatsApp." },
      { title: "Flexible terms", body: "Daily, weekly and monthly tiers — extend in one tap." },
    ],
  },
  testimonials: {
    eyebrow: "Stories from the road",
    title: "Trusted, ride after ride.",
    items: [
      { name: "Khadar A.", role: "Returning customer · Hargeisa", text: "I have rented from Modern Multi Services for three years. Cars are always clean, paperwork takes minutes, and Zaad payment is instant." },
      { name: "Sahra M.", role: "Diplomatic mission", text: "Their Luxury Land Cruisers are the only vehicles we trust for airport transfers. Drivers are punctual and the billing is transparent." },
      { name: "Yusuf O.", role: "SME owner", text: "Booked a Mini SUV from my phone in under five minutes. The bilingual contract gave my team total clarity." },
    ],
    paymentsLabel: "We accept",
    payments: ["Zaad", "E-dahab", "Premier Wallet", "Dahabshiil", "Darasalaam", "Premier Bank"],
  },
  faqs: {
    eyebrow: "Questions, answered",
    title: "Frequently asked questions.",
    body: "Everything you need to know before you book. Still stuck? Call 3032 any time.",
    items: [
      { q: "How do I book a car?", a: "Browse the fleet, choose your vehicle and dates, then complete our 5-step online booking — account, documents, contract, payment. The whole process takes about five minutes on your phone." },
      { q: "What documents do I need?", a: "A valid government-issued ID (national ID, passport or diplomatic ID) and a valid driving licence held for at least 6 months. Foreign visitors should bring a passport with a valid Somaliland entry visa." },
      { q: "How do I pay?", a: "We accept Zaad, E-dahab, Premier Wallet, and bank transfers through Dahabshiil, Darasalaam and Premier Bank. All prices are in USD. Payments confirm your booking instantly." },
      { q: "Is fuel included?", a: "Vehicles are delivered with a full tank. You return the car with a full tank — pay only for the fuel you use. Refuelling stations are available across Hargeisa and on every major highway." },
      { q: "Is there a mileage limit?", a: "All rentals of 3 days or more come with unlimited mileage inside Somaliland. Cross-border travel requires prior written approval." },
      { q: "Can I extend my rental?", a: "Yes — extend from your dashboard or by calling 3032. Extensions automatically benefit from our longer-term pricing tiers (lower daily rates from day 5, 10 and 30)." },
      { q: "What is your cancellation policy?", a: "Free cancellation up to 24 hours before pickup. Within 24 hours, a small handling fee applies. No-shows are charged for the first rental day only — never the full booking." },
      { q: "Do you deliver the car?", a: "Yes. Delivery and collection inside Hargeisa city are free of charge. Out-of-city delivery (Berbera, Burao, Borama and beyond) is available at a transparent per-kilometre rate." },
      { q: "Can I rent with a driver?", a: "Yes — driver-included service is available across every category, and especially popular for Luxury airport transfers, weddings and multi-day upcountry trips." },
      { q: "What if the car breaks down?", a: "Call 3032 any time, day or night. We dispatch roadside assistance immediately and, if needed, deliver a replacement vehicle at no cost." },
    ],
  },
  finalCta: {
    title: "Ready to hit the road?",
    body: "Reserve in minutes. Pay with mobile money. Drive away in Hargeisa today — or get the car delivered to your door, free of charge.",
  },
};

export const aboutDefaults: AboutContent = {
  hero: {
    eyebrow: "Our story",
    title: "One car in 2013.",
    accent: "A nation on the move today.",
    subtitle: "Modern Multi Services built professional car rental in Somaliland from the ground up — written contracts, full insurance, transparent USD pricing, and a team that answers the phone day or night. Hargeisa-born, nationally trusted.",
    ctaPrimary: "Read our story",
    ctaSecondary: "Meet the team",
  },
  stats: [
    { value: 12, suffix: "+", label: "Years on the road" },
    { value: 40, suffix: "", label: "Vehicles in active service" },
    { value: 8200, suffix: "+", label: "Customers served since 2013" },
    { value: 1, suffix: "st", label: "Professional rental company in Somaliland" },
  ],
  founder: {
    eyebrow: "A word from the founder",
    title: "Built on trust, one customer at a time.",
    name: "Khaalid Abdirahman",
    role: "CEO & Founder",
    initials: "KA",
    quote: "In 2013, I parked one sedan outside the Durdur Building and opened Modern Multi Services. At that time, professional car rental simply did not exist in Hargeisa. There were no written contracts, no insurance, and no proper receipts. I went from one bank to another looking for capital to grow the business. Every door closed. Not a single institution believed the idea could work. Today, those same banks are the ones asking to partner with us. The government, international NGOs, and the largest enterprises in Somaliland choose us as their trusted mobility partner. But I have never forgotten the first customers — the everyday families and small business owners who paid for a rental when all we had was one car and a handshake. They are the reason we stand here today. We are proud to be Somaliland's first fully digital car rental company — built carefully, built honestly, and built to last.",
    date: "— Hargeisa, May 2026",
  },
  timeline: {
    eyebrow: "The journey",
    title: "Twelve years. One direction — forward.",
    items: [
      { year: "2013", title: "One car, one phone number.", body: "Modern Multi Services opens with a single sedan and a hand-written contract — the first rental company in Hargeisa to offer written agreements, real receipts and a proper customer hotline." },
      { year: "2016", title: "Tested by the hardest years.", body: "Through drought, fuel shortages and a fragile economy, we honour every booking, service every car on schedule and hold our prices steady. No layoffs. No shortcuts. No surprises for the customer." },
      { year: "2019", title: "Rental moves online.", body: "First in Somaliland to accept Zaad, E-dahab and Premier Wallet. Bilingual contracts are signed on the customer's phone. Photo inspection at handover and return becomes the standard the industry now follows." },
      { year: "2022", title: "Forty vehicles. Three classes.", body: "The fleet expands to forty cars across Luxury, Mini SUV and Sedan tiers — serving embassies, NGOs, contractors, weddings, family trips and daily commuters across the country." },
      { year: "2026", title: "A platform, not just a fleet.", body: "A 24/7 call centre on 3032, a five-minute online booking flow, an in-house CRM and accounting system, and a team of eight specialists — the reference point for modern car rental in the Horn of Africa." },
    ],
  },
  values: {
    eyebrow: "What we stand for",
    title: "Six principles we will not bend.",
    items: [
      { title: "Honest by design", body: "No interest, no hidden charges, no surprise fees. Every contract is written in plain language and structured to be fair from the first line to the last." },
      { title: "Built in Somaliland", body: "A local company, owned and run by Somalilanders. Every contract is available in both English and Somali so nothing is ever lost in translation." },
      { title: "Customer dignity", body: "We explain every clause in the language you actually speak, in words you actually use. No fine print, no awkward calls after the rental ends." },
      { title: "Operational discipline", body: "Every car is inspected before and after each rental. Every payment is logged. Every booking has an owner inside the team. Nothing depends on memory." },
      { title: "Rooted in Hargeisa", body: "We know these roads, these garages, these customers and this weather. When something goes wrong upcountry, we already know who to call." },
      { title: "Always improving", body: "From paper contracts to mobile money, from radio ads to online booking — we keep upgrading the experience while keeping the price honest." },
    ],
  },
  team: {
    eyebrow: "The people behind the wheel",
    title: "Eight specialists. One promise.",
    intro: "A small, senior team. Each person owns a clear part of the business — and every one of them has the authority to make things right for a customer on the spot.",
    members: [
      { name: "Khaalid Abdirahman", role: "CEO & Founder", initials: "KA", hue: "from-cyan-500 to-blue-600", bio: "Founded the company in 2013 with one sedan and a notebook. Sets the standard for honest, transparent contracts and still answers customer calls in person." },
      { name: "Khadar Mohamed", role: "Marketing Manager", initials: "KM", hue: "from-fuchsia-500 to-pink-600", bio: "Owns the brand, the partnerships and the campaigns you hear on radio and see on the road. The reason new customers find us." },
      { name: "Faisal Warsame", role: "Operations Director", initials: "FW", hue: "from-amber-500 to-orange-600", bio: "Plans every handover, every airport pickup and every upcountry trip. Keeps forty vehicles in the right place at the right time." },
      { name: "Amina Yusuf", role: "Head of Customer Care", initials: "AY", hue: "from-emerald-500 to-teal-600", bio: "Runs the 24/7 hotline on 3032. Speaks four languages and trains the team to solve, not just answer." },
      { name: "Mustafe Ali", role: "Fleet Manager", initials: "MA", hue: "from-indigo-500 to-violet-600", bio: "Photo-inspects every car before it leaves and the moment it returns. Maintains the service schedule that keeps our fleet on the road." },
      { name: "Hodan Ibrahim", role: "Finance Manager", initials: "HI", hue: "from-rose-500 to-red-600", bio: "Guards transparent USD pricing and fair contract terms. If a charge is on your invoice, she can show you exactly why." },
      { name: "Abdiqani Saeed", role: "Head Mechanic", initials: "AS", hue: "from-sky-500 to-cyan-600", bio: "Twenty years under the hood. Final word on whether a car is safe to rent — and no vehicle leaves the yard without his sign-off." },
      { name: "Sahra Farah", role: "Reservations Lead", initials: "SF", hue: "from-lime-500 to-green-600", bio: "Turns a phone call or a WhatsApp message into a confirmed booking in under three minutes — vehicle, dates, contract and payment, all sorted." },
    ],
  },
  cta: {
    title: "Come and see for yourself.",
    body: "Visit us at the Durdur Building in Hargeisa, call 3032 at any hour, or reserve online in five minutes. Whichever door you choose, the same team — and the same promise — is waiting on the other side.",
  },
};

export function deepMerge<T>(base: T, override: any): T {
  if (override === null || override === undefined) return base;
  if (Array.isArray(base)) return (Array.isArray(override) ? override : base) as any;
  if (typeof base === "object" && base !== null && typeof override === "object") {
    const out: any = { ...(base as any) };
    for (const k of Object.keys(override)) {
      out[k] = deepMerge((base as any)[k], override[k]);
    }
    return out;
  }
  return (override ?? base) as T;
}

/* FLEET listing page */
export type FleetIndexContent = {
  hero: { eyebrow: string; title: string; body: string };
  emptyState: { title: string; body: string };
};

export const fleetIndexDefaults: FleetIndexContent = {
  hero: {
    eyebrow: "The fleet",
    title: "Pick the right car for your journey.",
    body: "Filter by category, body style and price. All prices in USD per day. Minimum rental is 4 days — daily rates drop automatically at 5, 10 and 30 days.",
  },
  emptyState: {
    title: "No vehicles match these filters",
    body: "Try widening your category or price range.",
  },
};