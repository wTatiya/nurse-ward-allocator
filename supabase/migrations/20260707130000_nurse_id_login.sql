-- Nurse ID login: store 7-digit employee ID on profiles

alter table public.profiles
  add column if not exists nurse_id text;

update public.profiles
set nurse_id = split_part(
  (select email from auth.users where auth.users.id = profiles.id),
  '@',
  1
)
where nurse_id is null
  and exists (
    select 1
    from auth.users
    where auth.users.id = profiles.id
      and auth.users.email like '%@nurse.ward-allocator.local'
  );

alter table public.profiles
  add constraint profiles_nurse_id_format
  check (nurse_id is null or nurse_id ~ '^\d{7}$');

create unique index if not exists profiles_nurse_id_key
  on public.profiles (nurse_id)
  where nurse_id is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parsed_nurse_id text;
begin
  parsed_nurse_id := coalesce(
    new.raw_user_meta_data ->> 'nurse_id',
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, full_name, role, nurse_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Nurse'),
    'nurse',
    case
      when parsed_nurse_id ~ '^\d{7}$' then parsed_nurse_id
      else null
    end
  );
  return new;
end;
$$;
