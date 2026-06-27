-- Add channel + refund workflow fields to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason text;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_channel_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_channel_check CHECK (channel IN ('online','manual'));

-- Refund workflow on payments
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS refund_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS refund_amount numeric,
  ADD COLUMN IF NOT EXISTS refund_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS refund_requested_by uuid,
  ADD COLUMN IF NOT EXISTS refund_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS refund_approved_by uuid,
  ADD COLUMN IF NOT EXISTS gateway text,
  ADD COLUMN IF NOT EXISTS gateway_ref text,
  ADD COLUMN IF NOT EXISTS gateway_payload jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_refund_status_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_refund_status_check
  CHECK (refund_status IN ('none','requested','approved','refunded','rejected'));

CREATE INDEX IF NOT EXISTS idx_bookings_channel ON public.bookings(channel);
CREATE INDEX IF NOT EXISTS idx_payments_refund_status ON public.payments(refund_status);
CREATE INDEX IF NOT EXISTS idx_invoices_booking ON public.invoices(booking_id);