
-- Assign a specific physical car (fleet unit) to a booking & capture pickup/return
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS fleet_unit_id uuid,
  ADD COLUMN IF NOT EXISTS pickup_at timestamptz,
  ADD COLUMN IF NOT EXISTS returned_at timestamptz,
  ADD COLUMN IF NOT EXISTS pickup_odometer integer,
  ADD COLUMN IF NOT EXISTS return_odometer integer,
  ADD COLUMN IF NOT EXISTS pickup_fuel text,
  ADD COLUMN IF NOT EXISTS return_fuel text,
  ADD COLUMN IF NOT EXISTS pickup_notes text,
  ADD COLUMN IF NOT EXISTS return_notes text,
  ADD COLUMN IF NOT EXISTS pickup_checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS return_checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS pickup_signature_url text,
  ADD COLUMN IF NOT EXISTS return_signature_url text;

CREATE INDEX IF NOT EXISTS bookings_fleet_unit_idx ON public.bookings(fleet_unit_id);
CREATE INDEX IF NOT EXISTS bookings_status_dates_idx ON public.bookings(status, start_date, end_date);

-- Keep fleet_units.status in sync with bookings (assign/release the physical car)
CREATE OR REPLACE FUNCTION public.sync_fleet_unit_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  old_unit uuid := CASE WHEN TG_OP = 'UPDATE' THEN OLD.fleet_unit_id ELSE NULL END;
  new_unit uuid := CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN NEW.fleet_unit_id ELSE OLD.fleet_unit_id END;
  new_status text := CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN NEW.status::text ELSE 'cancelled' END;
BEGIN
  -- Released: prior unit no longer associated, or booking ended/cancelled
  IF old_unit IS NOT NULL AND (old_unit IS DISTINCT FROM new_unit OR new_status IN ('completed','cancelled','rejected')) THEN
    UPDATE public.fleet_units SET status = 'available'
      WHERE id = old_unit AND status = 'rented';
  END IF;

  -- Assigned to active/confirmed booking: mark rented
  IF new_unit IS NOT NULL AND new_status IN ('confirmed','active','pending_approval') THEN
    UPDATE public.fleet_units SET status = 'rented'
      WHERE id = new_unit AND status = 'available';
  END IF;

  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_bookings_sync_fleet_unit ON public.bookings;
CREATE TRIGGER trg_bookings_sync_fleet_unit
AFTER INSERT OR UPDATE OF fleet_unit_id, status OR DELETE
ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.sync_fleet_unit_on_booking();
