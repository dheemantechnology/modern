
-- 1. Campaigns: landing page fields + single-active-digital constraint
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS landing_slug text,
  ADD COLUMN IF NOT EXISTS landing_template text NOT NULL DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS landing_published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vehicle_interest_id uuid;

-- Auto-generate landing_slug from name when blank
CREATE OR REPLACE FUNCTION public.campaigns_autoslug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  i int := 0;
BEGIN
  IF NEW.landing_slug IS NULL OR NEW.landing_slug = '' THEN
    base := regexp_replace(lower(coalesce(NEW.name,'campaign')), '[^a-z0-9]+', '-', 'g');
    base := trim(both '-' from base);
    IF base = '' THEN base := 'campaign'; END IF;
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM public.campaigns WHERE landing_slug = candidate AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
      i := i + 1;
      candidate := base || '-' || i;
    END LOOP;
    NEW.landing_slug := candidate;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_campaigns_autoslug ON public.campaigns;
CREATE TRIGGER trg_campaigns_autoslug
  BEFORE INSERT OR UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.campaigns_autoslug();

-- Backfill slugs for existing rows
UPDATE public.campaigns SET landing_slug = NULL WHERE landing_slug IS NULL;
UPDATE public.campaigns SET name = name; -- triggers autoslug for any null slug rows

-- Unique slug
CREATE UNIQUE INDEX IF NOT EXISTS campaigns_landing_slug_uidx ON public.campaigns (landing_slug);

-- Partial unique: only ONE active digital campaign
CREATE UNIQUE INDEX IF NOT EXISTS campaigns_one_active_digital_uidx
  ON public.campaigns ((true))
  WHERE type = 'digital' AND status = 'active';

-- Public read for PUBLISHED landing pages only
DROP POLICY IF EXISTS "campaigns public landing read" ON public.campaigns;
CREATE POLICY "campaigns public landing read"
  ON public.campaigns
  FOR SELECT
  TO anon, authenticated
  USING (landing_published = true);

GRANT SELECT ON public.campaigns TO anon;

-- Impression bump (callable by anon via server route)
CREATE OR REPLACE FUNCTION public.bump_campaign_impression(_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.campaigns SET impressions = COALESCE(impressions,0) + 1
  WHERE landing_slug = _slug AND landing_published = true;
$$;
REVOKE ALL ON FUNCTION public.bump_campaign_impression(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bump_campaign_impression(text) TO anon, authenticated, service_role;


-- 2. Lead activities: richer typed columns
ALTER TABLE public.lead_activities
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS meeting_minutes text,
  ADD COLUMN IF NOT EXISTS participants text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS duration_min integer;


-- 3. Leads: qualifying booking
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS qualifying_booking_id uuid;

CREATE INDEX IF NOT EXISTS leads_qualifying_booking_idx ON public.leads(qualifying_booking_id);
CREATE INDEX IF NOT EXISTS bookings_dates_idx ON public.bookings(vehicle_id, start_date, end_date);
