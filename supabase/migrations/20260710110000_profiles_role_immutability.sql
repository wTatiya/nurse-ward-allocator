-- SEC-01: Block profile role self-escalation (RLS + trigger defense-in-depth)

drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile except role"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role = (
    select p.role from public.profiles p where p.id = auth.uid()
  )
);

create or replace function public.guard_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not public.is_admin()
       and coalesce((auth.jwt() ->> 'role'), '') <> 'service_role' then
      raise exception 'profile role cannot be changed by non-admin';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role_change on public.profiles;
create trigger profiles_guard_role_change
  before update on public.profiles
  for each row execute function public.guard_profile_role_change();
