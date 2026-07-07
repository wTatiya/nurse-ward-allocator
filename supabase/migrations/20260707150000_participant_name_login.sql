-- Participant name login: internal slug maps to auth email until 7-digit IDs are issued

alter table public.profiles
  add column if not exists login_slug text;

create unique index if not exists profiles_login_slug_key
  on public.profiles (login_slug)
  where login_slug is not null;

create or replace function public.list_participant_login_options()
returns table (login_slug text, full_name text)
language sql
stable
security definer
set search_path = public
as $$
  select p.login_slug, p.full_name
  from public.profiles p
  where p.role = 'PARTICIPANT'
    and p.login_slug is not null
  order by p.full_name;
$$;

grant execute on function public.list_participant_login_options() to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parsed_nurse_id text;
  parsed_role public.user_role;
  parsed_login_slug text;
begin
  parsed_nurse_id := coalesce(
    new.raw_user_meta_data ->> 'nurse_id',
    split_part(new.email, '@', 1)
  );

  parsed_role := coalesce(
    (new.raw_user_meta_data ->> 'staff_role')::public.user_role,
    'PARTICIPANT'::public.user_role
  );

  parsed_login_slug := nullif(new.raw_user_meta_data ->> 'login_slug', '');

  insert into public.profiles (id, full_name, role, nurse_id, login_slug)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Nurse'),
    parsed_role,
    case
      when parsed_nurse_id ~ '^\d{7}$' then parsed_nurse_id
      else null
    end,
    parsed_login_slug
  );
  return new;
end;
$$;
