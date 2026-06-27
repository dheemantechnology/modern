import v8_2024 from "@/assets/vehicles/v8-2024.jpg";
import v8_2020 from "@/assets/vehicles/v8-2020.jpg";
import rav4_2023 from "@/assets/vehicles/rav4-2023.jpg";
import rav4_2018 from "@/assets/vehicles/rav4-2018.jpg";
import surf_2014 from "@/assets/vehicles/surf-2014.jpg";
import harrier_2016 from "@/assets/vehicles/harrier-2016.jpg";
import harrier_2009 from "@/assets/vehicles/harrier-2009.jpg";
import cx5_2019 from "@/assets/vehicles/cx5-2019.jpg";
import kia_2020 from "@/assets/vehicles/kia-2020.jpg";
import markii_2008 from "@/assets/vehicles/markii-2008.jpg";
import noah_2017 from "@/assets/vehicles/noah-2017.jpg";

export type Tier = "Luxury" | "Mini SUV" | "Sedan";

export const MIN_RENTAL_DAYS = 4;

export const tierLabel: Record<Tier, string> = {
  Luxury: "Luxury Cars",
  "Mini SUV": "Mini SUVs",
  Sedan: "Sedan Cars",
};

export type PricingBand = {
  label: string;
  minDays: number;
  maxDays: number | null;
  pricePerDay: number;
};

export type Vehicle = {
  id: string;
  name: string;
  year: number;
  tier: Tier;
  type: "Sedan" | "SUV" | "Compact" | "Minivan";
  seats: number;
  transmission: "Automatic" | "Manual";
  fuel: "Petrol" | "Diesel" | "Hybrid";
  image: string;
  available: boolean;
  inventory: number;
  features: string[];
  pricing: PricingBand[];
  description: string;
};

// Pricing bands per official Modern Multi Services price sheet.
// Minimum rental is 4 days.
const bands = (a: number, b: number, c: number, d: number): PricingBand[] => [
  { label: "4 – 5 days", minDays: 4, maxDays: 5, pricePerDay: a },
  { label: "5 – 10 days", minDays: 5, maxDays: 10, pricePerDay: b },
  { label: "10 – 20+ days", minDays: 10, maxDays: 30, pricePerDay: c },
  { label: "30+ days", minDays: 30, maxDays: null, pricePerDay: d },
];

export const fleet: Vehicle[] = [
  // ───────── LUXURY CARS ─────────
  {
    id: "toyota-v8-2024", name: "Toyota Land Cruiser V8", year: 2024, tier: "Luxury",
    type: "SUV", seats: 7, transmission: "Automatic", fuel: "Petrol",
    image: v8_2024, available: true, inventory: 3,
    features: ["Full leather interior", "Sunroof", "Premium JBL sound", "4WD", "Driver included on request", "Tinted glass"],
    pricing: bands(290, 270, 250, 240),
    description: "Our flagship executive SUV. The 2024 Land Cruiser V8 is the vehicle we deploy for diplomatic missions, executive transfers and convoy work across Somaliland — the most prestigious car you can rent in Hargeisa.",
  },
  {
    id: "toyota-v8-2020", name: "Toyota Land Cruiser V8", year: 2020, tier: "Luxury",
    type: "SUV", seats: 7, transmission: "Automatic", fuel: "Petrol",
    image: v8_2020, available: true, inventory: 4,
    features: ["Leather interior", "Cruise control", "Reverse camera", "4WD", "Tinted windows"],
    pricing: bands(190, 175, 165, 150),
    description: "A 2020 Land Cruiser V8 maintained to factory specification. The reliable executive choice for multi-day business trips and long-distance travel across the country.",
  },
  {
    id: "toyota-surf-2014", name: "Toyota Surf", year: 2014, tier: "Luxury",
    type: "SUV", seats: 7, transmission: "Automatic", fuel: "Diesel",
    image: surf_2014, available: true, inventory: 3,
    features: ["4WD low range", "Diesel economy", "High ground clearance", "Roof rails", "Reverse camera"],
    pricing: bands(120, 100, 85, 70),
    description: "A workhorse for upcountry travel — the Surf goes wherever the road runs out. The right vehicle for Laas Geel, Berbera and the eastern corridor when comfort and capability both matter.",
  },

  // ───────── MINI SUVs ─────────
  {
    id: "toyota-rav4-2023", name: "Toyota RAV4", year: 2023, tier: "Mini SUV",
    type: "SUV", seats: 5, transmission: "Automatic", fuel: "Hybrid",
    image: rav4_2023, available: true, inventory: 8,
    features: ["Hybrid engine", "Apple CarPlay", "Lane assist", "Reverse camera", "Push-button start"],
    pricing: bands(75, 65, 55, 45),
    description: "Modern hybrid crossover — efficient on long Somaliland highways and comfortable in Hargeisa city traffic. Our most fuel-conscious mid-size SUV.",
  },
  {
    id: "toyota-rav4-2018", name: "Toyota RAV4", year: 2018, tier: "Mini SUV",
    type: "SUV", seats: 5, transmission: "Automatic", fuel: "Petrol",
    image: rav4_2018, available: true, inventory: 7,
    features: ["Reverse camera", "Bluetooth", "AC", "Cruise control"],
    pricing: bands(70, 60, 50, 40),
    description: "Compact and dependable — the everyday RAV4. Easy to drive, easy to park, and ready for both city errands and weekend trips.",
  },
  {
    id: "toyota-harrier-2016", name: "Toyota Harrier", year: 2016, tier: "Mini SUV",
    type: "SUV", seats: 5, transmission: "Automatic", fuel: "Petrol",
    image: harrier_2016, available: true, inventory: 6,
    features: ["Leather seats", "Reverse camera", "Cruise control", "Panoramic display"],
    pricing: bands(70, 60, 50, 40),
    description: "Premium mid-size crossover with a smooth ride and a quiet, luxurious cabin. Popular with business travellers and families alike.",
  },
  {
    id: "mazda-cx5-2019", name: "Mazda CX-5", year: 2019, tier: "Mini SUV",
    type: "SUV", seats: 5, transmission: "Automatic", fuel: "Petrol",
    image: cx5_2019, available: true, inventory: 5,
    features: ["Sport mode", "Reverse camera", "AC", "Bluetooth", "Bold styling"],
    pricing: bands(65, 55, 45, 35),
    description: "Stylish Mazda CX-5 with confident handling and a distinctive Kodo design. A driver's crossover at a sensible price.",
  },
  {
    id: "toyota-harrier-2009", name: "Toyota Harrier", year: 2009, tier: "Mini SUV",
    type: "SUV", seats: 5, transmission: "Automatic", fuel: "Petrol",
    image: harrier_2009, available: false, inventory: 6,
    features: ["AC", "Bluetooth", "Comfortable cabin"],
    pricing: bands(65, 55, 45, 35),
    description: "A comfortable older-generation Harrier — a quiet, smooth cruiser that's been maintained to a high standard. Great value for longer rentals.",
  },

  // ───────── SEDAN CARS ─────────
  {
    id: "toyota-noah-2017", name: "Toyota Noah", year: 2017, tier: "Sedan",
    type: "Minivan", seats: 8, transmission: "Automatic", fuel: "Petrol",
    image: noah_2017, available: true, inventory: 12,
    features: ["8 seats", "Sliding side doors", "Climate AC", "Spacious boot"],
    pricing: bands(40, 35, 31, 27),
    description: "8-seat family minivan — the right choice for groups, weddings, family weekends and small group tours. Easy access through sliding doors.",
  },
  {
    id: "kia-2020", name: "Kia 2020", year: 2020, tier: "Sedan",
    type: "Sedan", seats: 5, transmission: "Automatic", fuel: "Petrol",
    image: kia_2020, available: true, inventory: 15,
    features: ["AC", "Bluetooth", "Fuel efficient", "Reverse sensors"],
    pricing: bands(35, 30, 27, 23),
    description: "Modern Kia sedan with low running costs and a comfortable ride. Perfect for in-town meetings, airport runs and daily city driving.",
  },
  {
    id: "toyota-mark-ii", name: "Toyota Mark II", year: 2008, tier: "Sedan",
    type: "Sedan", seats: 5, transmission: "Automatic", fuel: "Petrol",
    image: markii_2008, available: true, inventory: 20,
    features: ["AC", "Fuel efficient", "Power windows"],
    pricing: bands(25, 23, 21, 19),
    description: "The most affordable car in our fleet — perfect for short city rentals, students, and anyone who wants reliable transport without a premium price tag.",
  },
];

export const tierColors: Record<Tier, string> = {
  Luxury: "from-navy to-blue",
  "Mini SUV": "from-blue to-cyan",
  Sedan: "from-midblue to-cyan",
};

export function priceForDays(v: Vehicle, days: number) {
  const d = Math.max(days, MIN_RENTAL_DAYS);
  const band = v.pricing.find((b) => d >= b.minDays && (b.maxDays === null || d < b.maxDays)) ?? v.pricing[v.pricing.length - 1];
  return { perDay: band.pricePerDay, total: band.pricePerDay * d, band, days: d };
}

export function startingPrice(v: Vehicle) {
  return v.pricing[v.pricing.length - 1].pricePerDay;
}
