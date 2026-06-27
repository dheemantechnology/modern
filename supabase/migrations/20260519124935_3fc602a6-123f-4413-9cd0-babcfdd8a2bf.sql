
-- Vehicle Categories
CREATE TABLE public.vehicle_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories public read" ON public.vehicle_categories
  FOR SELECT TO public USING (true);

CREATE POLICY "categories staff write" ON public.vehicle_categories
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'::app_role) OR private.has_role(auth.uid(),'manager'::app_role))
  WITH CHECK (private.has_role(auth.uid(),'admin'::app_role) OR private.has_role(auth.uid(),'manager'::app_role));

CREATE TRIGGER trg_categories_touch BEFORE UPDATE ON public.vehicle_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Link vehicles (used as Vehicle Types) to categories
ALTER TABLE public.vehicles ADD COLUMN category_id uuid REFERENCES public.vehicle_categories(id) ON DELETE SET NULL;

-- Seed default categories
INSERT INTO public.vehicle_categories (name, slug, description, sort_order) VALUES
  ('Luxury', 'luxury', 'Premium executive vehicles for VIP and corporate use', 1),
  ('Mini SUV', 'mini-suv', 'Mid-size crossovers — efficient and comfortable', 2),
  ('Sedan', 'sedan', 'Affordable sedans and minivans for everyday use', 3);

-- Back-fill category_id from existing category text
UPDATE public.vehicles v SET category_id = c.id
FROM public.vehicle_categories c
WHERE lower(v.category) = lower(c.name) OR lower(v.category) = lower(c.slug);

-- Fleet Units (physical cars)
CREATE TYPE public.fleet_unit_status AS ENUM ('available','rented','maintenance','retired');

CREATE TABLE public.fleet_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  plate_number text NOT NULL UNIQUE,
  vin text UNIQUE,
  color text,
  mileage integer NOT NULL DEFAULT 0,
  status public.fleet_unit_status NOT NULL DEFAULT 'available',
  purchase_date date,
  purchase_price numeric,
  insurance_expiry date,
  registration_expiry date,
  photo_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fleet_units_vehicle ON public.fleet_units(vehicle_id);
CREATE INDEX idx_fleet_units_status ON public.fleet_units(status);

ALTER TABLE public.fleet_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fleet_units public read" ON public.fleet_units
  FOR SELECT TO public USING (true);

CREATE POLICY "fleet_units staff write" ON public.fleet_units
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'::app_role) OR private.has_role(auth.uid(),'manager'::app_role))
  WITH CHECK (private.has_role(auth.uid(),'admin'::app_role) OR private.has_role(auth.uid(),'manager'::app_role));

CREATE TRIGGER trg_fleet_units_touch BEFORE UPDATE ON public.fleet_units
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Maintenance Records
CREATE TABLE public.maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fleet_unit_id uuid NOT NULL REFERENCES public.fleet_units(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'service',
  title text NOT NULL,
  description text,
  cost numeric NOT NULL DEFAULT 0,
  odometer integer,
  vendor text,
  performed_at date NOT NULL DEFAULT CURRENT_DATE,
  next_due_at date,
  status text NOT NULL DEFAULT 'completed',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_maintenance_unit ON public.maintenance_records(fleet_unit_id);
CREATE INDEX idx_maintenance_performed ON public.maintenance_records(performed_at DESC);

ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maintenance staff read" ON public.maintenance_records
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));

CREATE POLICY "maintenance staff write" ON public.maintenance_records
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'::app_role) OR private.has_role(auth.uid(),'manager'::app_role))
  WITH CHECK (private.has_role(auth.uid(),'admin'::app_role) OR private.has_role(auth.uid(),'manager'::app_role));

CREATE TRIGGER trg_maintenance_touch BEFORE UPDATE ON public.maintenance_records
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
