
-- 1. Restrict fleet_units to staff only (contains VINs, prices)
DROP POLICY IF EXISTS "fleet_units public read" ON public.fleet_units;
CREATE POLICY "fleet_units staff read" ON public.fleet_units
  FOR SELECT TO authenticated
  USING (private.is_staff(auth.uid()));

-- 2. Restrict app_settings to staff only (contains payment configs)
DROP POLICY IF EXISTS "settings public read" ON public.app_settings;
CREATE POLICY "settings staff read" ON public.app_settings
  FOR SELECT TO authenticated
  USING (private.is_staff(auth.uid()));

-- 3. Tighten bookings customer insert — require customer_id to belong to the user
DROP POLICY IF EXISTS "bookings customer insert" ON public.bookings;
CREATE POLICY "bookings customer insert" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      customer_id IS NULL
      OR customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
    )
  );

-- 4. Remove public listing on storage.objects for public-assets.
-- Files remain accessible via public CDN URLs because the bucket is public=true.
DROP POLICY IF EXISTS "public assets read" ON storage.objects;
