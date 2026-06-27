import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Public: get booked date ranges for a vehicle type (by NAME — site uses static fleet).
 *  A date is "unavailable" only when EVERY active fleet unit of the type is booked on that date.
 */
export const getVehicleBookedRanges = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        vehicleName: z.string().min(1).max(120),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: vehicles, error: vErr } = await supabaseAdmin
      .from("vehicles")
      .select("id")
      .ilike("name", `%${data.vehicleName}%`);
    if (vErr) throw new Error(vErr.message);
    const ids = (vehicles ?? []).map((v) => v.id);
    if (!ids.length) return { ranges: [] as { start: string; end: string }[] };

    // Count active (non-retired) units per vehicle type — this is the capacity.
    const { data: units } = await supabaseAdmin
      .from("fleet_units")
      .select("id, vehicle_id, status")
      .in("vehicle_id", ids)
      .neq("status", "retired");
    const capacity = (units ?? []).length || 1;

    const { data: bookings, error: bErr } = await supabaseAdmin
      .from("bookings")
      .select("start_date, end_date, status")
      .in("vehicle_id", ids)
      .in("status", ["pending_approval", "confirmed", "active"] as any);
    if (bErr) throw new Error(bErr.message);

    // Build per-day occupancy and emit only fully-saturated ranges.
    if (!bookings || bookings.length === 0) return { ranges: [] };
    const counts = new Map<string, number>();
    for (const b of bookings) {
      const s = new Date(b.start_date as string);
      const e = new Date(b.end_date as string);
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    const fullDays = Array.from(counts.entries())
      .filter(([, n]) => n >= capacity)
      .map(([k]) => k)
      .sort();
    // Compact contiguous days into ranges
    const ranges: { start: string; end: string }[] = [];
    for (const day of fullDays) {
      const last = ranges[ranges.length - 1];
      if (last) {
        const next = new Date(last.end); next.setDate(next.getDate() + 1);
        if (next.toISOString().slice(0, 10) === day) { last.end = day; continue; }
      }
      ranges.push({ start: day, end: day });
    }
    return {
      ranges,
    };
  });