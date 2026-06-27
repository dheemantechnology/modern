export type RateTier = { min_days: number; max_days: number | null; daily_rate: number };

export function normalizeTiers(raw: any): RateTier[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t) => ({
      min_days: Math.max(1, Number(t?.min_days ?? 1)),
      max_days: t?.max_days == null || t?.max_days === "" ? null : Number(t.max_days),
      daily_rate: Number(t?.daily_rate ?? 0),
    }))
    .filter((t) => t.daily_rate >= 0)
    .sort((a, b) => a.min_days - b.min_days);
}

/** Pick the daily rate for a given number of days. Falls back to baseRate when no tier matches. */
export function pickDailyRate(tiers: any, days: number, baseRate: number): number {
  const list = normalizeTiers(tiers);
  const d = Math.max(1, days);
  const match = list.find((t) => d >= t.min_days && (t.max_days == null || d <= t.max_days));
  return match ? match.daily_rate : Number(baseRate || 0);
}

export function formatTierLabel(t: RateTier): string {
  if (t.max_days == null) return `${t.min_days}+ days`;
  if (t.min_days === t.max_days) return `${t.min_days} day${t.min_days === 1 ? "" : "s"}`;
  return `${t.min_days} - ${t.max_days} days`;
}