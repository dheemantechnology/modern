import { Landmark, HeartHandshake, Building2 } from "lucide-react";

type Row = {
  label: string;
  icon: typeof Landmark;
  accent: string;
  items: string[];
  direction?: "normal" | "reverse";
};

const rows: Row[] = [
  {
    label: "Government & Ministries",
    icon: Landmark,
    accent: "text-cyan",
    items: [
      "Ministry of Interior",
      "Ministry of Finance",
      "Ministry of Foreign Affairs",
      "Ministry of Transport",
      "Ministry of Health",
      "Ministry of Education",
      "Hargeisa Municipality",
      "Somaliland Police",
      "Civil Aviation Authority",
    ],
  },
  {
    label: "NGOs & International Agencies",
    icon: HeartHandshake,
    accent: "text-cyan",
    direction: "reverse",
    items: [
      "UNDP",
      "UNICEF",
      "WHO",
      "Save the Children",
      "NRC",
      "DRC",
      "Mercy Corps",
      "CARE International",
      "Oxfam",
      "World Vision",
    ],
  },
  {
    label: "Companies & Corporates",
    icon: Building2,
    accent: "text-cyan",
    items: [
      "Dahabshiil",
      "Telesom",
      "Somtel",
      "Premier Bank",
      "Salaam Bank",
      "Coca-Cola Somaliland",
      "Berbera Port",
      "Daallo Airlines",
      "Ethiopian Airlines",
      "Indha Deero",
    ],
  },
];

function MarqueeRow({ row }: { row: Row }) {
  const Icon = row.icon;
  const animClass = row.direction === "reverse" ? "animate-marquee-reverse" : "animate-marquee";
  // Duplicate items so the -50% translate creates a seamless loop
  const items = [...row.items, ...row.items];

  return (
    <div className="group">
      <div className="mb-3 flex items-center gap-2 px-1">
        <Icon className={`h-4 w-4 ${row.accent}`} />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {row.label}
        </span>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card py-4 shadow-card">
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-card to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-card to-transparent" />
        <div className={`flex w-max gap-3 ${animClass} group-hover:[animation-play-state:paused]`}>
          {items.map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="flex h-12 items-center gap-2 whitespace-nowrap rounded-xl border border-border bg-background px-5 text-sm font-semibold text-navy transition hover:border-cyan/40 hover:text-cyan"
            >
              <Icon className={`h-3.5 w-3.5 ${row.accent}`} />
              {name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PartnersMarquee() {
  return (
    <section className="bg-background py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan">
            Trusted by
          </p>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">
            Driving with ministries, NGOs and businesses.
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            From government delegations to international missions and Somaliland's leading
            companies — they choose Modern Multi Services for reliable mobility.
          </p>
        </div>

        <div className="mt-10 space-y-6">
          {rows.map((row) => (
            <MarqueeRow key={row.label} row={row} />
          ))}
        </div>
      </div>
    </section>
  );
}