import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FormDialog, FieldGroup, Input, Select, Textarea, PrimaryButton, GhostButton } from "@/components/admin/FormDialog";
import { swal } from "@/lib/swal";

type Mode = "pickup" | "return";
type Props = { bookingId: string | null; mode: Mode; onClose: () => void };

const PICKUP_ITEMS = [
  ["exterior_clean", "Exterior clean & photographed"],
  ["interior_clean", "Interior clean"],
  ["no_visible_damage", "No visible damage"],
  ["tires_ok", "Tires inspected"],
  ["spare_present", "Spare tyre present"],
  ["jack_present", "Jack & toolkit present"],
  ["registration_in_car", "Registration & insurance in car"],
  ["fuel_recorded", "Fuel level recorded"],
] as const;

const RETURN_ITEMS = [
  ["exterior_ok", "Exterior inspected"],
  ["interior_ok", "Interior inspected"],
  ["damage_noted", "Any damage noted in notes"],
  ["fuel_returned", "Fuel level acceptable"],
  ["spare_present", "Spare tyre returned"],
  ["jack_present", "Jack & toolkit returned"],
  ["personal_items_removed", "Customer items removed"],
  ["keys_returned", "Keys returned"],
] as const;

export function RentalHandoverDialog({ bookingId, mode, onClose }: Props) {
  const qc = useQueryClient();
  const [odometer, setOdometer] = useState<number | "">("");
  const [fuel, setFuel] = useState("Full");
  const [notes, setNotes] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [pickupDate, setPickupDate] = useState<string>("");

  const { data: booking } = useQuery({
    queryKey: ["handover-booking", bookingId],
    enabled: !!bookingId,
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings")
        .select("*, vehicles(name), fleet_units(plate_number, mileage), customers(full_name, phone, license_no)")
        .eq("id", bookingId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!booking) return;
    if (mode === "pickup") {
      setOdometer(booking.pickup_odometer ?? (booking.fleet_units as any)?.mileage ?? "");
      setFuel(booking.pickup_fuel ?? "Full");
      setNotes(booking.pickup_notes ?? "");
      setChecks((booking.pickup_checklist as any) ?? {});
      setIssues({});
      // Prefill from existing pickup_at, else booking start_date, else today
      const initial = booking.pickup_at
        ? new Date(booking.pickup_at).toISOString().slice(0, 10)
        : (booking.start_date ?? new Date().toISOString().slice(0, 10));
      setPickupDate(initial);
    } else {
      setOdometer(booking.return_odometer ?? "");
      setFuel(booking.return_fuel ?? "Full");
      setNotes(booking.return_notes ?? "");
      const rc = (booking.return_checklist as any) ?? {};
      setChecks(rc);
      setIssues((rc.__issues as Record<string, string>) ?? {});
    }
  }, [booking, mode]);

  const items = mode === "pickup" ? PICKUP_ITEMS : RETURN_ITEMS;

  const save = useMutation({
    mutationFn: async () => {
      if (!booking) throw new Error("No booking");
      if (!booking.fleet_unit_id) throw new Error("Assign a plate before handover");
      const patch: any = {};
      if (mode === "pickup") {
        // Use the admin-chosen date at the current time of day
        const now = new Date();
        const chosen = pickupDate
          ? new Date(`${pickupDate}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`)
          : now;
        patch.pickup_at = chosen.toISOString();
        // Keep booking start_date in sync if the admin moved it
        if (pickupDate && pickupDate !== booking.start_date) {
          patch.start_date = pickupDate;
        }
        patch.pickup_odometer = odometer === "" ? null : Number(odometer);
        patch.pickup_fuel = fuel;
        patch.pickup_notes = notes || null;
        patch.pickup_checklist = checks;
        patch.status = "active";
      } else {
        patch.returned_at = new Date().toISOString();
        patch.return_odometer = odometer === "" ? null : Number(odometer);
        patch.return_fuel = fuel;
        // Append per-item issues to the return notes for an at-a-glance record
        const issueLines = items
          .filter(([k]) => !checks[k] && issues[k]?.trim())
          .map(([k, label]) => `• ${label}: ${issues[k].trim()}`);
        const combined = [notes?.trim(), issueLines.join("\n")].filter(Boolean).join("\n\n");
        patch.return_notes = combined || null;
        patch.return_checklist = { ...checks, __issues: issues };
        patch.status = "completed";
      }
      const { error } = await supabase.from("bookings").update(patch).eq("id", booking.id);
      if (error) throw error;
      // Bump fleet unit mileage on return
      if (mode === "return" && odometer !== "" && booking.fleet_unit_id) {
        await supabase.from("fleet_units").update({ mileage: Number(odometer) }).eq("id", booking.fleet_unit_id);
      }
    },
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ["rentals"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["fleet-units"] });
      onClose();
      await swal.fire({
        icon: "success",
        title: mode === "pickup" ? "Car handed over" : "Return recorded",
        text: mode === "pickup" ? "Customer can now drive away." : "Booking marked completed and car is back in inventory.",
        timer: 1800, showConfirmButton: false,
      });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!bookingId) return null;

  const Icon = mode === "pickup" ? KeyRound : Undo2;
  const title = mode === "pickup" ? "Pickup checklist" : "Return checklist";
  const allDone = items.every(([k]) => checks[k]);
  // For return mode, every unchecked item must include an issue description
  const missingIssues = mode === "return"
    ? items.filter(([k]) => !checks[k] && !issues[k]?.trim()).map(([, label]) => label)
    : [];
  const canSubmit = mode === "pickup" ? allDone : missingIssues.length === 0;

  return (
    <FormDialog open onClose={onClose} title={title}
      subtitle={booking ? `${booking.reference} · ${(booking.vehicles as any)?.name ?? ""} · ${(booking.fleet_units as any)?.plate_number ?? "no plate"}` : ""}
      size="lg"
      footer={<>
        <GhostButton onClick={onClose}>Cancel</GhostButton>
        <PrimaryButton onClick={() => save.mutate()} disabled={save.isPending || !canSubmit}>
          {save.isPending ? "Saving…" : mode === "pickup" ? "Hand over car" : "Complete return"}
        </PrimaryButton>
      </>}
    >
      <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-cyan/10 px-3 py-2 text-xs font-semibold text-cyan">
        <Icon className="h-4 w-4" /> {booking?.customers?.full_name ?? "Customer"} · {(booking?.customers as any)?.phone ?? ""}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {mode === "pickup" && (
          <FieldGroup label="Pickup date" required>
            <Input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
          </FieldGroup>
        )}
        <FieldGroup label="Odometer (km)" required>
          <Input type="number" value={odometer} onChange={(e) => setOdometer(e.target.value === "" ? "" : Number(e.target.value))} />
        </FieldGroup>
        <FieldGroup label="Fuel level">
          <Select value={fuel} onChange={(e) => setFuel(e.target.value)}>
            {["Empty", "1/4", "1/2", "3/4", "Full"].map((f) => <option key={f} value={f}>{f}</option>)}
          </Select>
        </FieldGroup>
        <FieldGroup label="Status">
          <div className={`rounded-md px-3 py-2 text-xs font-semibold ${allDone ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {allDone ? "All items checked" : `${items.filter(([k]) => checks[k]).length}/${items.length} checked`}
          </div>
        </FieldGroup>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card p-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-navy">Checklist</p>
        {mode === "return" && (
          <p className="mb-3 text-[11px] text-muted-foreground">
            Untick anything that's not OK and describe the issue (damage, dirty, missing item, fuel level, etc.). A description is required for every unticked item.
          </p>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map(([k, label]) => {
            const ticked = !!checks[k];
            return (
              <div key={k} className="rounded-md border border-border bg-background px-3 py-2 text-sm hover:border-cyan">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={ticked} onChange={(e) => setChecks({ ...checks, [k]: e.target.checked })} className="h-4 w-4 accent-cyan" />
                  {ticked && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                  <span className={ticked ? "text-foreground" : "text-muted-foreground"}>{label}</span>
                </label>
                {mode === "return" && !ticked && (
                  <Input
                    className="mt-2"
                    placeholder="Describe the issue (e.g. dented bumper, dirty seats, low fuel)…"
                    value={issues[k] ?? ""}
                    onChange={(e) => setIssues({ ...issues, [k]: e.target.value })}
                  />
                )}
              </div>
            );
          })}
        </div>
        {mode === "return" && missingIssues.length > 0 && (
          <p className="mt-2 text-[11px] font-medium text-amber-700">
            Add a note for: {missingIssues.join(", ")}
          </p>
        )}
      </div>

      <FieldGroup label={mode === "pickup" ? "Pickup notes" : "Return notes / damage report"}>
        <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={mode === "pickup" ? "Pickup location, scratches photographed, etc." : "Any damage, late return, additional charges, etc."} />
      </FieldGroup>
    </FormDialog>
  );
}