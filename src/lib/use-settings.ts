import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SettingsMap = {
  company: { name: string; hotline: string; phone: string; email: string; address: string };
  contact: { primaryPhone: string; secondaryPhone: string; whatsapp: string; email: string; supportEmail: string; hotline: string; mapUrl: string };
  social: { facebook: string; instagram: string; twitter: string; linkedin: string; tiktok: string; youtube: string };
  hours: { weekdays: string; friday: string; callCentre: string; timezone: string };
  financial: { currency: string; taxRate: number; taxName: string; invoicePrefix: string; quotePrefix: string; fiscalYearStart: string; decimalPlaces: number };
  refundPolicy: { freeCancellationHours: number; partialRefundPercent: number; partialRefundCutoffHours: number; noRefundCutoffHours: number; processingDays: number; maxRefundIsPaidAmount: boolean; notes: string };
  footer: { tagline: string; copyright: string; poweredBy: string; badges: string[] };
  booking: { minRentalDays: number; maxRentalDays: number; advanceBookingDays: number; requireDeposit: boolean; depositAmount: number; requireApproval: boolean };
  seo: { siteName: string; defaultTitle: string; defaultDescription: string; themeColor: string };
  policies: { mileage: string; currency: string; depositUSD: number; fuelPolicy: string; lateFeePerDay: number; minRentalDays: number };
  payments: { methods: string[]; zaadShortcode: string; edahabShortcode: string };
};

export const SETTING_DEFAULTS: SettingsMap = {
  company: { name: "Modern Multi Services", hotline: "3032", phone: "+252 63 4 100 200", email: "hello@modernmulti.so", address: "Durdur Building, Caro Edeg, Hargeisa, Somaliland" },
  contact: { primaryPhone: "+252 63 4 100 200", secondaryPhone: "+252 63 4 865 985", whatsapp: "+252634865985", email: "hello@modernmulti.so", supportEmail: "support@modernmulti.so", hotline: "3032", mapUrl: "https://www.google.com/maps?q=Hargeisa,Somaliland&output=embed" },
  social: { facebook: "", instagram: "", twitter: "", linkedin: "", tiktok: "", youtube: "" },
  hours: { weekdays: "Sat – Thu · 8:00 – 22:00", friday: "Friday · 14:00 – 22:00", callCentre: "24/7 — dial 3032", timezone: "Africa/Mogadishu" },
  financial: { currency: "USD", taxRate: 0.05, taxName: "VAT", invoicePrefix: "INV", quotePrefix: "QT", fiscalYearStart: "01-01", decimalPlaces: 2 },
  refundPolicy: { freeCancellationHours: 48, partialRefundPercent: 50, partialRefundCutoffHours: 24, noRefundCutoffHours: 12, processingDays: 3, maxRefundIsPaidAmount: true, notes: "Refunds cannot exceed the amount the customer paid." },
  footer: { tagline: "Built for Somaliland.", copyright: "Modern Multi Services. All rights reserved.", poweredBy: "Powered by Dhool Digital", badges: ["USD pricing", "Bilingual EN / SO", "24/7 hotline"] },
  booking: { minRentalDays: 1, maxRentalDays: 60, advanceBookingDays: 90, requireDeposit: true, depositAmount: 200, requireApproval: true },
  seo: { siteName: "Modern Multi Services", defaultTitle: "Modern Multi Services", defaultDescription: "Premium car rental in Hargeisa.", themeColor: "#0891b2" },
  policies: { mileage: "Unlimited (3+ days)", currency: "USD", depositUSD: 200, fuelPolicy: "Full to full", lateFeePerDay: 35, minRentalDays: 1 },
  payments: { methods: ["Zaad", "E-dahab", "Premier Wallet", "Dahabshiil", "Premier Bank"], zaadShortcode: "*222*3032#", edahabShortcode: "*770*3032#" },
};

export function useSetting<K extends keyof SettingsMap>(key: K): SettingsMap[K] {
  const { data } = useQuery({
    queryKey: ["app_settings", key],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
      return (data?.value as SettingsMap[K]) ?? null;
    },
    staleTime: 300_000,
  });
  return { ...(SETTING_DEFAULTS[key] as object), ...((data ?? {}) as object) } as SettingsMap[K];
}

export function useAllSettings(): Record<string, any> {
  const { data } = useQuery({
    queryKey: ["app_settings", "all"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("key, value");
      const map: Record<string, any> = {};
      (data ?? []).forEach((r: any) => { map[r.key] = r.value; });
      return map;
    },
    staleTime: 300_000,
  });
  return data ?? {};
}

export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(amount || 0));
}