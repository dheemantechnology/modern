import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Public: submit an online booking from the website (no auth required).
 *  Looks up the vehicle by name+year, creates/links a customer, inserts the
 *  booking as `online` + `pending_approval`, and records the payment.
 */
export const submitOnlineBooking = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        vehicleName: z.string().min(1).max(120),
        vehicleYear: z.number().int().min(1980).max(2100).optional(),
        startDate: z.string().min(8).max(10),
        endDate: z.string().min(8).max(10),
        days: z.number().int().min(1).max(365),
        dailyRate: z.number().min(0).max(100000),
        total: z.number().min(0).max(1000000),
        pickupLocation: z.string().max(255).optional(),
        customer: z.object({
          fullName: z.string().min(1).max(255),
          phone: z.string().min(3).max(40),
          email: z.string().email().max(255).optional().or(z.literal("")),
        }),
        paymentMethod: z.string().min(1).max(40),
        notes: z.string().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    // 1) Resolve vehicle by name (+ year when provided)
    let vehicleQuery = supabaseAdmin
      .from("vehicles")
      .select("id, name, year, daily_rate")
      .ilike("name", `%${data.vehicleName}%`)
      .limit(1);
    if (data.vehicleYear) vehicleQuery = vehicleQuery.eq("year", data.vehicleYear);
    const { data: vehicles, error: vErr } = await vehicleQuery;
    if (vErr) throw new Error(vErr.message);
    const vehicle = vehicles?.[0];
    if (!vehicle) throw new Error(`Vehicle not found: ${data.vehicleName} ${data.vehicleYear ?? ""}`);

    // 2) Find or create a customer by phone (fallback email)
    const normalizedPhone = data.customer.phone.replace(/\D/g, "");
    let customerId: string | null = null;
    let customerExisted = false;
    if (normalizedPhone) {
      // Match any stored phone whose digits end with the same last 7 digits
      const tail = normalizedPhone.slice(-7);
      const { data: candidates } = await supabaseAdmin
        .from("customers")
        .select("id, phone")
        .not("phone", "is", null);
      const match = (candidates ?? []).find(
        (c) => (c.phone ?? "").replace(/\D/g, "").endsWith(tail),
      );
      if (match) {
        customerId = match.id;
        customerExisted = true;
      }
    }
    if (!customerId && data.customer.email) {
      const { data: existing } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("email", data.customer.email)
        .limit(1);
      if (existing?.[0]?.id) {
        customerId = existing[0].id;
        customerExisted = true;
      }
    }
    if (!customerId) {
      const { data: created, error: cErr } = await supabaseAdmin
        .from("customers")
        .insert({
          full_name: data.customer.fullName,
          phone: data.customer.phone || null,
          email: data.customer.email || null,
          source: "website" as any,
          approval_status: "pending" as any,
        })
        .select("id")
        .single();
      if (cErr) throw new Error(cErr.message);
      customerId = created.id;
    }

    // 3) Insert booking (channel=online, pending approval)
    const { data: booking, error: bErr } = await supabaseAdmin
      .from("bookings")
      .insert({
        vehicle_id: vehicle.id,
        customer_id: customerId,
        start_date: data.startDate,
        end_date: data.endDate,
        daily_rate: data.dailyRate,
        total: data.total,
        pickup_location: data.pickupLocation || null,
        notes: data.notes || null,
        channel: "online",
        status: "pending_approval" as any,
      })
      .select("id, reference")
      .single();
    if (bErr) throw new Error(bErr.message);

    // 4) Record payment (pending — operations team confirms)
    const { error: pErr } = await supabaseAdmin.from("payments").insert({
      booking_id: booking.id,
      amount: data.total,
      method: data.paymentMethod,
      status: "pending" as any,
      transaction_ref: `WEB-${booking.reference}`,
    });
    if (pErr) throw new Error(pErr.message);

    return {
      bookingId: booking.id,
      reference: booking.reference,
      customerExisted,
    };
  });