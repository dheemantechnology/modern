create schema if not exists private;

grant usage on schema private to authenticated;

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

create or replace function private.is_staff(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role in ('admin','manager','editor','viewer')
  )
$$;

grant execute on function private.has_role(uuid, public.app_role) to authenticated;
grant execute on function private.is_staff(uuid) to authenticated;

revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.is_staff(uuid) from public, anon, authenticated;

drop policy if exists "profiles self read" on public.profiles;
drop policy if exists "profiles staff read" on public.profiles;
drop policy if exists "profiles admin all" on public.profiles;
create policy "profiles self read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles staff read" on public.profiles for select to authenticated using (private.is_staff(auth.uid()));
create policy "profiles admin all" on public.profiles for all to authenticated using (private.has_role(auth.uid(),'admin')) with check (private.has_role(auth.uid(),'admin'));

drop policy if exists "user_roles self read" on public.user_roles;
drop policy if exists "user_roles admin read" on public.user_roles;
drop policy if exists "user_roles admin write" on public.user_roles;
create policy "user_roles self read" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "user_roles admin read" on public.user_roles for select to authenticated using (private.has_role(auth.uid(),'admin'));
create policy "user_roles admin write" on public.user_roles for all to authenticated using (private.has_role(auth.uid(),'admin')) with check (private.has_role(auth.uid(),'admin'));

drop policy if exists "vehicles staff write" on public.vehicles;
create policy "vehicles staff write" on public.vehicles for all to authenticated using (private.has_role(auth.uid(),'admin') or private.has_role(auth.uid(),'manager')) with check (private.has_role(auth.uid(),'admin') or private.has_role(auth.uid(),'manager'));

drop policy if exists "customers staff read" on public.customers;
drop policy if exists "customers staff write" on public.customers;
create policy "customers staff read" on public.customers for select to authenticated using (private.is_staff(auth.uid()) or user_id = auth.uid());
create policy "customers staff write" on public.customers for all to authenticated using (private.has_role(auth.uid(),'admin') or private.has_role(auth.uid(),'manager')) with check (private.has_role(auth.uid(),'admin') or private.has_role(auth.uid(),'manager'));

drop policy if exists "bookings read" on public.bookings;
drop policy if exists "bookings staff write" on public.bookings;
create policy "bookings read" on public.bookings for select to authenticated using (private.is_staff(auth.uid()) or created_by = auth.uid());
create policy "bookings staff write" on public.bookings for all to authenticated using (private.has_role(auth.uid(),'admin') or private.has_role(auth.uid(),'manager')) with check (private.has_role(auth.uid(),'admin') or private.has_role(auth.uid(),'manager'));

drop policy if exists "payments staff read" on public.payments;
drop policy if exists "payments staff write" on public.payments;
create policy "payments staff read" on public.payments for select to authenticated using (private.is_staff(auth.uid()));
create policy "payments staff write" on public.payments for all to authenticated using (private.has_role(auth.uid(),'admin') or private.has_role(auth.uid(),'manager')) with check (private.has_role(auth.uid(),'admin') or private.has_role(auth.uid(),'manager'));

drop policy if exists "invoices staff read" on public.invoices;
drop policy if exists "invoices staff write" on public.invoices;
create policy "invoices staff read" on public.invoices for select to authenticated using (private.is_staff(auth.uid()));
create policy "invoices staff write" on public.invoices for all to authenticated using (private.has_role(auth.uid(),'admin') or private.has_role(auth.uid(),'manager')) with check (private.has_role(auth.uid(),'admin') or private.has_role(auth.uid(),'manager'));

drop policy if exists "cms editor write" on public.cms_pages;
create policy "cms editor write" on public.cms_pages for all to authenticated using (private.has_role(auth.uid(),'admin') or private.has_role(auth.uid(),'manager') or private.has_role(auth.uid(),'editor')) with check (private.has_role(auth.uid(),'admin') or private.has_role(auth.uid(),'manager') or private.has_role(auth.uid(),'editor'));

drop policy if exists "settings admin write" on public.app_settings;
create policy "settings admin write" on public.app_settings for all to authenticated using (private.has_role(auth.uid(),'admin')) with check (private.has_role(auth.uid(),'admin'));