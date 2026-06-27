
-- 1. Helper: link existing bookings (and through them, payments/invoices) to a customer
CREATE OR REPLACE FUNCTION public.link_customer_history(_customer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c RECORD;
BEGIN
  SELECT id, user_id, email, phone, converted_from_lead_id
    INTO c FROM public.customers WHERE id = _customer_id;
  IF c IS NULL THEN RETURN; END IF;

  -- Match bookings by the same auth user
  IF c.user_id IS NOT NULL THEN
    UPDATE public.bookings
      SET customer_id = _customer_id
      WHERE customer_id IS NULL AND created_by = c.user_id;
  END IF;

  -- Match bookings whose customer record shares email/phone (unattached customers)
  UPDATE public.bookings b
    SET customer_id = _customer_id
    FROM public.customers other
    WHERE b.customer_id = other.id
      AND other.id <> _customer_id
      AND (
        (c.email IS NOT NULL AND lower(other.email) = lower(c.email))
        OR (c.phone IS NOT NULL AND regexp_replace(other.phone,'\D','','g') = regexp_replace(c.phone,'\D','','g'))
      );
END $$;

-- 2. Auto-link on conversion: when a customer is created with converted_from_lead_id
CREATE OR REPLACE FUNCTION public.on_customer_inserted_link_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.link_customer_history(NEW.id);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS customers_link_history ON public.customers;
CREATE TRIGGER customers_link_history
AFTER INSERT ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.on_customer_inserted_link_history();

-- 3. Recompute lifetime_value when payments change
CREATE OR REPLACE FUNCTION public.recompute_customer_ltv(_customer_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.customers c SET lifetime_value = COALESCE((
    SELECT SUM(
      CASE
        WHEN p.status = 'paid' THEN p.amount
        WHEN p.refund_status = 'refunded' THEN -COALESCE(p.refund_amount, p.amount)
        ELSE 0
      END
    )
    FROM public.payments p
    JOIN public.bookings b ON b.id = p.booking_id
    WHERE b.customer_id = _customer_id
  ), 0)
  WHERE c.id = _customer_id;
$$;

CREATE OR REPLACE FUNCTION public.on_payment_change_recompute_ltv()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE cid uuid;
BEGIN
  SELECT customer_id INTO cid FROM public.bookings
    WHERE id = COALESCE(NEW.booking_id, OLD.booking_id);
  IF cid IS NOT NULL THEN PERFORM public.recompute_customer_ltv(cid); END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS payments_ltv ON public.payments;
CREATE TRIGGER payments_ltv
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.on_payment_change_recompute_ltv();

-- Backfill once
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.customers LOOP
    PERFORM public.recompute_customer_ltv(r.id);
  END LOOP;
END $$;
