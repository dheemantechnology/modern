
TRUNCATE TABLE public.invoices RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.payments RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.bookings RESTART IDENTITY CASCADE;

-- Release any plates left in 'rented' state
UPDATE public.fleet_units SET status = 'available' WHERE status = 'rented';

-- Reset customer lifetime value since payments are gone
UPDATE public.customers SET lifetime_value = 0 WHERE lifetime_value <> 0;

-- Clear lead linkage to wiped bookings
UPDATE public.leads SET qualifying_booking_id = NULL WHERE qualifying_booking_id IS NOT NULL;
