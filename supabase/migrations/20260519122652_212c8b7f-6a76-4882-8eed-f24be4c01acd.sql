
-- Storage bucket for user-managed images (vehicle photos, avatars, customer docs)
insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do nothing;

-- Public read
create policy "public assets read"
  on storage.objects for select
  using (bucket_id = 'public-assets');

-- Staff write/update/delete
create policy "public assets staff write"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'public-assets' and (
      private.has_role(auth.uid(), 'admin'::app_role) or
      private.has_role(auth.uid(), 'manager'::app_role) or
      private.has_role(auth.uid(), 'editor'::app_role)
    )
  );

create policy "public assets staff update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'public-assets' and (
      private.has_role(auth.uid(), 'admin'::app_role) or
      private.has_role(auth.uid(), 'manager'::app_role) or
      private.has_role(auth.uid(), 'editor'::app_role)
    )
  );

create policy "public assets staff delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'public-assets' and (
      private.has_role(auth.uid(), 'admin'::app_role) or
      private.has_role(auth.uid(), 'manager'::app_role)
    )
  );

-- Customer 360 columns
alter table public.customers
  add column if not exists avatar_url text,
  add column if not exists loyalty_tier text not null default 'bronze',
  add column if not exists date_of_birth date,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists tags text[] not null default '{}';

-- Payment refund support
alter table public.payments
  add column if not exists parent_payment_id uuid references public.payments(id) on delete set null,
  add column if not exists refund_days integer,
  add column if not exists refund_reason text;

-- Customer activity / notes log (internal CRM)
create table if not exists public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  author_id uuid,
  kind text not null default 'note',
  body text not null,
  created_at timestamptz not null default now()
);
alter table public.customer_notes enable row level security;
create policy "notes staff read" on public.customer_notes for select to authenticated
  using (private.is_staff(auth.uid()));
create policy "notes staff write" on public.customer_notes for all to authenticated
  using (private.is_staff(auth.uid()))
  with check (private.is_staff(auth.uid()));
create index if not exists customer_notes_customer_idx on public.customer_notes(customer_id, created_at desc);
