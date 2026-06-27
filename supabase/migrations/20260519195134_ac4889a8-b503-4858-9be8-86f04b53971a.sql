
-- CRM module: campaigns, leads, lead_activities + customer approval

CREATE TYPE campaign_type AS ENUM ('physical','digital');
CREATE TYPE campaign_status AS ENUM ('draft','scheduled','active','paused','completed','cancelled');
CREATE TYPE lead_stage AS ENUM ('new','contacted','qualified','proposal','negotiation','won','lost');
CREATE TYPE lead_source AS ENUM ('website','referral','walk_in','social','campaign','phone','whatsapp','event','other');
CREATE TYPE customer_approval AS ENUM ('pending','approved','rejected');

-- Campaigns
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type campaign_type NOT NULL DEFAULT 'digital',
  status campaign_status NOT NULL DEFAULT 'draft',
  channel text,                                -- e.g. Facebook, Billboard, SMS, Radio
  objective text,                              -- awareness, lead-gen, conversion, retention
  audience text,                               -- target audience description
  headline text,
  body text,                                   -- creative copy / message
  call_to_action text,
  creative_url text,                           -- image/video link
  landing_url text,
  start_date date,
  end_date date,
  budget numeric(12,2) DEFAULT 0,
  spend numeric(12,2) DEFAULT 0,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  conversions integer DEFAULT 0,
  tags text[] NOT NULL DEFAULT '{}',
  meta jsonb NOT NULL DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns staff read"  ON public.campaigns FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "campaigns staff write" ON public.campaigns FOR ALL    TO authenticated
  USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'))
  WITH CHECK (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'));
CREATE TRIGGER touch_campaigns BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Leads
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL DEFAULT ('LEAD-' || upper(substr(gen_random_uuid()::text,1,6))),
  full_name text NOT NULL,
  email text,
  phone text,
  city text,
  source lead_source NOT NULL DEFAULT 'other',
  stage lead_stage NOT NULL DEFAULT 'new',
  score integer NOT NULL DEFAULT 0,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  vehicle_interest_id uuid,                    -- soft ref to vehicles
  expected_value numeric(12,2) DEFAULT 0,
  expected_close_date date,
  assigned_to uuid,
  notes text,
  tags text[] NOT NULL DEFAULT '{}',
  customer_id uuid,                            -- set when converted
  converted_at timestamptz,
  lost_reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX leads_stage_idx ON public.leads(stage);
CREATE INDEX leads_campaign_idx ON public.leads(campaign_id);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads staff read"  ON public.leads FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "leads staff write" ON public.leads FOR ALL    TO authenticated
  USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'))
  WITH CHECK (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'));
CREATE TRIGGER touch_leads BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Lead activities (history / followups / stage changes)
CREATE TABLE public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'note',           -- note|call|email|sms|meeting|stage_change|conversion|whatsapp|task
  body text,
  old_stage lead_stage,
  new_stage lead_stage,
  due_at timestamptz,
  done boolean NOT NULL DEFAULT false,
  author_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lead_act_lead_idx ON public.lead_activities(lead_id, created_at DESC);
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lead_act staff read"  ON public.lead_activities FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "lead_act staff write" ON public.lead_activities FOR ALL    TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

-- Customer approval / source / link to lead
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS approval_status customer_approval NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS source lead_source,
  ADD COLUMN IF NOT EXISTS converted_from_lead_id uuid,
  ADD COLUMN IF NOT EXISTS lifetime_value numeric(12,2) NOT NULL DEFAULT 0;

-- Auto stage-change activity logger
CREATE OR REPLACE FUNCTION public.log_lead_stage_change()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.stage IS DISTINCT FROM OLD.stage THEN
    INSERT INTO public.lead_activities(lead_id, kind, body, old_stage, new_stage, author_id)
    VALUES (NEW.id, 'stage_change',
            'Stage moved from ' || OLD.stage || ' to ' || NEW.stage,
            OLD.stage, NEW.stage, auth.uid());
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER lead_stage_audit
AFTER UPDATE OF stage ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.log_lead_stage_change();

-- Auto-set converted_at when customer_id is filled
CREATE OR REPLACE FUNCTION public.mark_lead_converted()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL AND OLD.customer_id IS NULL THEN
    NEW.converted_at := now();
    NEW.stage := 'won';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER lead_converted_set
BEFORE UPDATE OF customer_id ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.mark_lead_converted();
