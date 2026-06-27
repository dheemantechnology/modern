
-- ===== ENUMS =====
create type public.app_role as enum ('admin','manager','editor','viewer');
create type public.vehicle_status as enum ('available','rented','maintenance','retired');
create type public.booking_status as enum ('pending_approval','confirmed','active','completed','rejected','cancelled');
create type public.payment_status as enum ('pending','paid','failed','refunded');
create type public.kyc_status as enum ('pending','approved','rejected');

-- ===== PROFILES =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- ===== USER ROLES =====
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role in ('admin','manager','editor','viewer')
  )
$$;

-- Auto-create profile on signup; first user gets admin role
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  user_count int;
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));

  select count(*) into user_count from auth.users;
  if user_count <= 1 then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ===== VEHICLES =====
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  make text,
  model text,
  year int,
  category text,
  daily_rate numeric(10,2) not null default 0,
  status public.vehicle_status not null default 'available',
  image_url text,
  images jsonb not null default '[]'::jsonb,
  specs jsonb not null default '{}'::jsonb,
  description text,
  seats int default 5,
  transmission text default 'Automatic',
  fuel text default 'Petrol',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.vehicles enable row level security;

-- ===== CUSTOMERS =====
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  national_id text,
  license_no text,
  license_expiry date,
  kyc_status public.kyc_status not null default 'pending',
  documents jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.customers enable row level security;

-- ===== BOOKINGS =====
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('MMS-' || upper(substr(gen_random_uuid()::text,1,6))),
  vehicle_id uuid references public.vehicles(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  start_date date not null,
  end_date date not null,
  days int generated always as ((end_date - start_date) + 1) stored,
  daily_rate numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status public.booking_status not null default 'pending_approval',
  pickup_location text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bookings enable row level security;

-- ===== PAYMENTS =====
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  method text not null default 'zaad',
  amount numeric(10,2) not null,
  status public.payment_status not null default 'pending',
  ussd_ref text,
  transaction_ref text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.payments enable row level security;

-- ===== INVOICES =====
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  number text not null unique default ('INV-' || to_char(now(),'YYYYMM') || '-' || upper(substr(gen_random_uuid()::text,1,5))),
  amount numeric(10,2) not null,
  pdf_url text,
  issued_at timestamptz not null default now()
);
alter table public.invoices enable row level security;

-- ===== CMS PAGES =====
create table public.cms_pages (
  slug text primary key,
  title text not null,
  sections jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.cms_pages enable row level security;

-- ===== SETTINGS =====
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;

-- ===== RLS POLICIES =====

-- profiles
create policy "profiles self read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "profiles self update" on public.profiles for update to authenticated using (id = auth.uid());
create policy "profiles admin all" on public.profiles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- user_roles
create policy "user_roles self read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "user_roles admin write" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- vehicles: public read; staff write
create policy "vehicles public read" on public.vehicles for select using (true);
create policy "vehicles staff write" on public.vehicles for all to authenticated
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'manager'))
  with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'manager'));

-- customers: staff only
create policy "customers staff read" on public.customers for select to authenticated using (public.is_staff(auth.uid()) or user_id = auth.uid());
create policy "customers staff write" on public.customers for all to authenticated
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'manager'))
  with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'manager'));

-- bookings: staff or owner
create policy "bookings read" on public.bookings for select to authenticated using (public.is_staff(auth.uid()) or created_by = auth.uid());
create policy "bookings staff write" on public.bookings for all to authenticated
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'manager'))
  with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'manager'));
create policy "bookings customer insert" on public.bookings for insert to authenticated with check (created_by = auth.uid());

-- payments / invoices: staff only
create policy "payments staff read" on public.payments for select to authenticated using (public.is_staff(auth.uid()));
create policy "payments staff write" on public.payments for all to authenticated
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'manager'))
  with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'manager'));

create policy "invoices staff read" on public.invoices for select to authenticated using (public.is_staff(auth.uid()));
create policy "invoices staff write" on public.invoices for all to authenticated
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'manager'))
  with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'manager'));

-- cms: public read, editor+ write
create policy "cms public read" on public.cms_pages for select using (true);
create policy "cms editor write" on public.cms_pages for all to authenticated
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'manager') or public.has_role(auth.uid(),'editor'))
  with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'manager') or public.has_role(auth.uid(),'editor'));

-- settings: public read, admin write
create policy "settings public read" on public.app_settings for select using (true);
create policy "settings admin write" on public.app_settings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- updated_at trigger
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger t_profiles_updated before update on public.profiles for each row execute function public.touch_updated_at();
create trigger t_vehicles_updated before update on public.vehicles for each row execute function public.touch_updated_at();
create trigger t_customers_updated before update on public.customers for each row execute function public.touch_updated_at();
create trigger t_bookings_updated before update on public.bookings for each row execute function public.touch_updated_at();
create trigger t_cms_updated before update on public.cms_pages for each row execute function public.touch_updated_at();

-- Seed CMS pages
insert into public.cms_pages (slug, title, sections) values
('home','Home', '{"hero":{"eyebrow":"Premium car rental in Hargeisa","title":"Drive the city your way","subtitle":"Modern, well-maintained vehicles. Shari''a-compliant pricing. 24/7 hotline 3032.","cta":"Browse fleet"},"features":[{"icon":"shield","title":"Verified vehicles","body":"Every car inspected before handover."},{"icon":"clock","title":"24/7 support","body":"Hotline 3032 and WhatsApp."},{"icon":"badge","title":"Transparent pricing","body":"No hidden fees. Refund on rejection."}]}'::jsonb),
('about','About', '{"hero":{"title":"About Modern Multi Services","subtitle":"Hargeisa''s trusted mobility partner."},"story":"Founded to bring modern, reliable car rental to Somaliland, we operate a curated fleet with a focus on safety, transparency, and customer care.","values":[{"title":"Trust","body":"Clear contracts, no surprises."},{"title":"Care","body":"Spotless cars, attentive staff."},{"title":"Speed","body":"Book in minutes, drive same day."}]}'::jsonb)
on conflict (slug) do nothing;

-- Seed settings
insert into public.app_settings (key, value) values
('company', '{"name":"Modern Multi Services","hotline":"3032","phone":"+252 63 4829 005","email":"hello@mmsauto.so","address":"Durdur Building, Hargeisa, Somaliland"}'::jsonb)
on conflict (key) do nothing;
