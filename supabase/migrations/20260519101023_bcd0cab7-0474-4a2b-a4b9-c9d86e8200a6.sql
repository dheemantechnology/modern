grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_staff(uuid) to authenticated;

drop policy if exists "profiles self read" on public.profiles;
drop policy if exists "profiles staff read" on public.profiles;
create policy "profiles self read"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles staff read"
on public.profiles
for select
to authenticated
using (public.is_staff(auth.uid()));

drop policy if exists "user_roles self read" on public.user_roles;
drop policy if exists "user_roles admin read" on public.user_roles;
create policy "user_roles self read"
on public.user_roles
for select
to authenticated
using (user_id = auth.uid());

create policy "user_roles admin read"
on public.user_roles
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));