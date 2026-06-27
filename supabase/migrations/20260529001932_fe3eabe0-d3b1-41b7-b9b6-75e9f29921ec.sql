ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_fleet_unit_fkey
  FOREIGN KEY (fleet_unit_id) REFERENCES public.fleet_units(id) ON DELETE SET NULL;