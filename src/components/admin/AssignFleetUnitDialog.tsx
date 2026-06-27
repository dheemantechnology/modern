import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Car } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FormDialog, FieldGroup, Select, PrimaryButton, GhostButton } from "@/components/admin/FormDialog";
import { swal } from "@/lib/swal";

type Props = { bookingId: string | null; onClose: () => void };

/** Pick a specific physical car (fleet unit) for a booking. */
export function AssignFleetUnitDialog({ bookingId, onClose }: Props) {
  const qc = useQueryClient();
  const [unitId, setUnitId] = useState("");

  const { data: booking } = useQuery({
    queryKey: ["assign-booking", bookingId],
    enabled: !!bookingId,
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings")
        .select("id, reference, vehicle_id, fleet_unit_id, start_date, end_date, vehicles(name)")
        .eq("id", bookingId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => { setUnitId((booking?.fleet_unit_id as string) ?? ""); }, [booking?.fleet_unit_id]);

  const { data: units = [] } = useQuery({
    queryKey: ["fleet-units-for", booking?.vehicle_id, booking?.start_date, booking?.end_date],
    enabled: !!booking?.vehicle_id,
    queryFn: async () => {
      const { data: u, error } = await supabase.from("fleet_units")
        .select("id, plate_number, status, mileage, color")
        .eq("vehicle_id", booking!.vehicle_id!)
        .neq("status", "retired")
        .order("plate_number");
      if (error) throw error;
      // Find plates already booked overlapping this window
      const { data: conflicts } = await supabase.from("bookings")
        .select("fleet_unit_id")
        .eq("vehicle_id", booking!.vehicle_id!)
        .neq("id", booking!.id)
        .in("status", ["pending_approval", "confirmed", "active"] as any)
        .lte("start_date", booking!.end_date)
        .gte("end_date", booking!.start_date);
      const taken = new Set((conflicts ?? []).map((c: any) => c.fleet_unit_id).filter(Boolean));
      return (u ?? []).map((x: any) => ({ ...x, taken: taken.has(x.id) }));
    },
  });

  const assign = useMutation({
    mutationFn: async () => {
      if (!bookingId) throw new Error("No booking");
      const { error } = await supabase.from("bookings")
        .update({ fleet_unit_id: unitId || null })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["rentals"] });
      qc.invalidateQueries({ queryKey: ["fleet-units"] });
      onClose();
      await swal.fire({ icon: "success", title: "Vehicle assigned", timer: 1400, showConfirmButton: false });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!bookingId) return null;

  return (
    <FormDialog open onClose={onClose} title="Assign vehicle (plate)"
      subtitle={booking ? `${booking.reference} · ${(booking.vehicles as any)?.name ?? ""} · ${booking.start_date} → ${booking.end_date}` : ""}
      size="md"
      footer={<>
        <GhostButton onClick={onClose}>Close</GhostButton>
        <PrimaryButton onClick={() => assign.mutate()} disabled={!unitId || assign.isPending}>
          {assign.isPending ? "Assigning…" : "Assign plate"}
        </PrimaryButton>
      </>}
    >
      <FieldGroup label="Available plate" required>
        <Select value={unitId} onChange={(e) => setUnitId(e.target.value)}>
          <option value="">Select a plate…</option>
          {(units as any[]).map((u) => (
            <option key={u.id} value={u.id} disabled={u.taken && u.id !== booking?.fleet_unit_id}>
              {u.plate_number} · {u.color ?? "—"} · {u.mileage?.toLocaleString() ?? 0} km
              {u.taken ? " · (already booked in this window)" : ` · ${u.status}`}
            </option>
          ))}
        </Select>
      </FieldGroup>
      {(units as any[]).length === 0 && (
        <p className="mt-2 inline-flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <Car className="h-3.5 w-3.5" /> No fleet units for this vehicle type. Add one in Fleet → Vehicles.
        </p>
      )}
    </FormDialog>
  );
}