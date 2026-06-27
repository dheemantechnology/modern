import type { ComponentType } from "react";
import {
  Image as ImageIcon, BadgeCheck, ListChecks, Car, ShieldCheck, ClipboardCheck,
  Banknote, Compass, MapPin, Building2, Sparkles, MessageSquareQuote,
  HelpCircle, Megaphone, Quote, Clock, Users, Trophy, BarChart3,
} from "lucide-react";

export type FieldDef =
  | { kind: "text"; key: string; label: string; placeholder?: string }
  | { kind: "textarea"; key: string; label: string; rows?: number; placeholder?: string }
  | { kind: "number"; key: string; label: string }
  | { kind: "object"; key: string; label: string; fields: FieldDef[] }
  | { kind: "list"; key: string; label: string; itemLabel: string; itemFields: FieldDef[]; max?: number }
  | { kind: "stringList"; key: string; label: string; itemLabel: string };

export type SectionDef = {
  key: string;
  label: string;
  description?: string;
  icon: ComponentType<{ className?: string }>;
  fields: FieldDef[];
};

/* HOME schema */
export const homeSchema: SectionDef[] = [
  {
    key: "hero", label: "Hero slider", icon: ImageIcon,
    description: "Rotating hero on the homepage. Image is matched to a vehicle in the fleet by its ID.",
    fields: [
      { kind: "list", key: "slides", label: "Slides", itemLabel: "Slide", itemFields: [
        { kind: "text", key: "kicker", label: "Kicker (small label above headline)" },
        { kind: "text", key: "title", label: "Headline line 1" },
        { kind: "text", key: "accent", label: "Headline line 2 (highlighted)" },
        { kind: "textarea", key: "text", label: "Supporting text", rows: 3 },
        { kind: "text", key: "imageId", label: "Vehicle image ID (e.g. toyota-v8-2024)" },
      ]},
      { kind: "object", key: "primaryCta", label: "Primary CTA", fields: [
        { kind: "text", key: "label", label: "Label" }, { kind: "text", key: "href", label: "Link" },
      ]},
      { kind: "object", key: "secondaryCta", label: "Secondary CTA", fields: [
        { kind: "text", key: "label", label: "Label" }, { kind: "text", key: "href", label: "Link" },
      ]},
    ],
  },
  {
    key: "trustBadges", label: "Trust strip", icon: BadgeCheck,
    description: "Four short badges shown directly under the hero.",
    fields: [{ kind: "list", key: "_root", label: "Badges", itemLabel: "Badge", max: 4, itemFields: [
      { kind: "text", key: "title", label: "Title" },
      { kind: "text", key: "subtitle", label: "Subtitle" },
    ]}],
  },
  {
    key: "howItWorks", label: "How it works", icon: ListChecks,
    fields: [
      { kind: "text", key: "eyebrow", label: "Eyebrow" },
      { kind: "text", key: "headingLead", label: "Heading line 1" },
      { kind: "text", key: "headingTail", label: "Heading line 2" },
      { kind: "textarea", key: "intro", label: "Intro paragraph", rows: 2 },
      { kind: "list", key: "steps", label: "Steps", itemLabel: "Step", max: 3, itemFields: [
        { kind: "text", key: "tag", label: "Tag" },
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "text", label: "Body", rows: 3 },
        { kind: "text", key: "meta", label: "Footer meta" },
      ]},
      { kind: "text", key: "promiseEyebrow", label: "Promise eyebrow" },
      { kind: "text", key: "promiseText", label: "Promise statement" },
      { kind: "text", key: "promiseCta", label: "Promise CTA label" },
    ],
  },
  {
    key: "fleetSection", label: "Fleet preview", icon: Car,
    fields: [
      { kind: "text", key: "eyebrow", label: "Eyebrow" },
      { kind: "text", key: "title", label: "Title" },
      { kind: "textarea", key: "body", label: "Body", rows: 3 },
      { kind: "list", key: "tiers", label: "Tier summaries", itemLabel: "Tier", itemFields: [
        { kind: "text", key: "tier", label: "Tier" },
        { kind: "text", key: "tagline", label: "Tagline" },
        { kind: "text", key: "bestFor", label: "Best for" },
      ]},
    ],
  },
  {
    key: "requirements", label: "Rental requirements", icon: ClipboardCheck,
    fields: [
      { kind: "text", key: "eyebrow", label: "Eyebrow" },
      { kind: "text", key: "title", label: "Title" },
      { kind: "textarea", key: "body", label: "Body", rows: 2 },
      { kind: "list", key: "items", label: "Requirements", itemLabel: "Requirement", max: 4, itemFields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "text", label: "Text", rows: 2 },
      ]},
    ],
  },
  {
    key: "included", label: "Included & protections", icon: ShieldCheck,
    fields: [
      { kind: "text", key: "eyebrow", label: "Eyebrow" },
      { kind: "text", key: "title", label: "Title" },
      { kind: "textarea", key: "body", label: "Body", rows: 2 },
      { kind: "stringList", key: "list", label: "Included bullets", itemLabel: "Bullet" },
      { kind: "list", key: "protections", label: "Protection cards", itemLabel: "Card", max: 4, itemFields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "body", label: "Body", rows: 2 },
      ]},
    ],
  },
  {
    key: "pricing", label: "Pricing & policies", icon: Banknote,
    fields: [
      { kind: "text", key: "eyebrow", label: "Eyebrow" },
      { kind: "text", key: "title", label: "Title" },
      { kind: "textarea", key: "body", label: "Body", rows: 2 },
      { kind: "list", key: "tiers", label: "Pricing tiers", itemLabel: "Tier", max: 4, itemFields: [
        { kind: "text", key: "range", label: "Day range" },
        { kind: "text", key: "label", label: "Label" },
      ]},
      { kind: "list", key: "policies", label: "Policies", itemLabel: "Policy", max: 3, itemFields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "body", label: "Body", rows: 2 },
      ]},
    ],
  },
  {
    key: "useCases", label: "Use cases", icon: Compass,
    fields: [
      { kind: "text", key: "eyebrow", label: "Eyebrow" },
      { kind: "text", key: "title", label: "Title" },
      { kind: "list", key: "items", label: "Use cases", itemLabel: "Use case", max: 4, itemFields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "body", label: "Body", rows: 2 },
      ]},
    ],
  },
  {
    key: "destinations", label: "Destinations", icon: MapPin,
    fields: [
      { kind: "text", key: "eyebrow", label: "Eyebrow" },
      { kind: "text", key: "title", label: "Title" },
      { kind: "textarea", key: "body", label: "Body", rows: 3 },
      { kind: "list", key: "items", label: "Destinations", itemLabel: "Destination", itemFields: [
        { kind: "text", key: "name", label: "Route" },
        { kind: "text", key: "km", label: "Distance" },
        { kind: "text", key: "note", label: "Note" },
      ]},
    ],
  },
  {
    key: "corporate", label: "Corporate program", icon: Building2,
    fields: [
      { kind: "text", key: "eyebrow", label: "Eyebrow" },
      { kind: "text", key: "title", label: "Title" },
      { kind: "textarea", key: "body", label: "Body", rows: 3 },
      { kind: "stringList", key: "bullets", label: "Bullets", itemLabel: "Bullet" },
      { kind: "text", key: "ctaLabel", label: "CTA label" },
    ],
  },
  {
    key: "whyUs", label: "Why us", icon: Sparkles,
    fields: [
      { kind: "text", key: "eyebrow", label: "Eyebrow" },
      { kind: "text", key: "title", label: "Title" },
      { kind: "textarea", key: "body", label: "Body", rows: 3 },
      { kind: "stringList", key: "bullets", label: "Bullets", itemLabel: "Bullet" },
      { kind: "list", key: "cards", label: "Cards", itemLabel: "Card", max: 4, itemFields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "body", label: "Body", rows: 2 },
      ]},
    ],
  },
  {
    key: "testimonials", label: "Testimonials & payments", icon: MessageSquareQuote,
    fields: [
      { kind: "text", key: "eyebrow", label: "Eyebrow" },
      { kind: "text", key: "title", label: "Title" },
      { kind: "list", key: "items", label: "Testimonials", itemLabel: "Testimonial", itemFields: [
        { kind: "text", key: "name", label: "Name" },
        { kind: "text", key: "role", label: "Role" },
        { kind: "textarea", key: "text", label: "Quote", rows: 3 },
      ]},
      { kind: "text", key: "paymentsLabel", label: "Payments label" },
      { kind: "stringList", key: "payments", label: "Payment methods", itemLabel: "Method" },
    ],
  },
  {
    key: "faqs", label: "FAQs", icon: HelpCircle,
    fields: [
      { kind: "text", key: "eyebrow", label: "Eyebrow" },
      { kind: "text", key: "title", label: "Title" },
      { kind: "textarea", key: "body", label: "Body", rows: 2 },
      { kind: "list", key: "items", label: "Q&A", itemLabel: "Question", itemFields: [
        { kind: "text", key: "q", label: "Question" },
        { kind: "textarea", key: "a", label: "Answer", rows: 3 },
      ]},
    ],
  },
  {
    key: "finalCta", label: "Final CTA", icon: Megaphone,
    fields: [
      { kind: "text", key: "title", label: "Title" },
      { kind: "textarea", key: "body", label: "Body", rows: 2 },
    ],
  },
];

/* ABOUT schema */
export const aboutSchema: SectionDef[] = [
  {
    key: "hero", label: "Hero", icon: ImageIcon,
    fields: [
      { kind: "text", key: "eyebrow", label: "Eyebrow" },
      { kind: "text", key: "title", label: "Title (line 1)" },
      { kind: "text", key: "accent", label: "Accent (line 2)" },
      { kind: "textarea", key: "subtitle", label: "Subtitle", rows: 3 },
      { kind: "text", key: "ctaPrimary", label: "Primary CTA label" },
      { kind: "text", key: "ctaSecondary", label: "Secondary CTA label" },
    ],
  },
  {
    key: "stats", label: "Stats", icon: BarChart3,
    fields: [{ kind: "list", key: "_root", label: "Stats", itemLabel: "Stat", max: 4, itemFields: [
      { kind: "number", key: "value", label: "Number" },
      { kind: "text", key: "suffix", label: "Suffix (+, st…)" },
      { kind: "text", key: "label", label: "Label" },
    ]}],
  },
  {
    key: "founder", label: "Founder quote", icon: Quote,
    fields: [
      { kind: "text", key: "eyebrow", label: "Eyebrow" },
      { kind: "text", key: "title", label: "Title" },
      { kind: "text", key: "name", label: "Founder name" },
      { kind: "text", key: "role", label: "Founder role" },
      { kind: "text", key: "initials", label: "Initials" },
      { kind: "textarea", key: "quote", label: "Quote", rows: 6 },
      { kind: "text", key: "date", label: "Date / location" },
    ],
  },
  {
    key: "timeline", label: "Timeline", icon: Clock,
    fields: [
      { kind: "text", key: "eyebrow", label: "Eyebrow" },
      { kind: "text", key: "title", label: "Title" },
      { kind: "list", key: "items", label: "Milestones", itemLabel: "Milestone", itemFields: [
        { kind: "text", key: "year", label: "Year" },
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "body", label: "Body", rows: 3 },
      ]},
    ],
  },
  {
    key: "values", label: "Values", icon: Trophy,
    fields: [
      { kind: "text", key: "eyebrow", label: "Eyebrow" },
      { kind: "text", key: "title", label: "Title" },
      { kind: "list", key: "items", label: "Values", itemLabel: "Value", max: 6, itemFields: [
        { kind: "text", key: "title", label: "Title" },
        { kind: "textarea", key: "body", label: "Body", rows: 2 },
      ]},
    ],
  },
  {
    key: "team", label: "Team", icon: Users,
    fields: [
      { kind: "text", key: "eyebrow", label: "Eyebrow" },
      { kind: "text", key: "title", label: "Title" },
      { kind: "textarea", key: "intro", label: "Intro", rows: 2 },
      { kind: "list", key: "members", label: "Members", itemLabel: "Member", itemFields: [
        { kind: "text", key: "name", label: "Name" },
        { kind: "text", key: "role", label: "Role" },
        { kind: "text", key: "initials", label: "Initials" },
        { kind: "text", key: "hue", label: "Gradient (Tailwind, e.g. from-cyan-500 to-blue-600)" },
        { kind: "textarea", key: "bio", label: "Bio", rows: 2 },
      ]},
    ],
  },
  {
    key: "cta", label: "Closing CTA", icon: Megaphone,
    fields: [
      { kind: "text", key: "title", label: "Title" },
      { kind: "textarea", key: "body", label: "Body", rows: 2 },
    ],
  },
];

/* FLEET listing page */
export const fleetIndexSchema: SectionDef[] = [
  {
    key: "hero", label: "Hero", icon: ImageIcon,
    description: "Top banner shown above the fleet filters.",
    fields: [
      { kind: "text", key: "eyebrow", label: "Eyebrow" },
      { kind: "text", key: "title", label: "Title" },
      { kind: "textarea", key: "body", label: "Body", rows: 3 },
    ],
  },
  {
    key: "emptyState", label: "Empty state", icon: HelpCircle,
    description: "Shown when filters return no vehicles.",
    fields: [
      { kind: "text", key: "title", label: "Title" },
      { kind: "textarea", key: "body", label: "Body", rows: 2 },
    ],
  },
];