-- Participant login: 7-digit nurse_id (same as staff auth email pattern).
-- Removes public name dropdown RPC used by the old login UI.

drop function if exists public.list_participant_login_options();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parsed_nurse_id text;
  parsed_role public.user_role;
begin
  parsed_nurse_id := coalesce(
    new.raw_user_meta_data ->> 'nurse_id',
    split_part(new.email, '@', 1)
  );

  parsed_role := coalesce(
    (new.raw_user_meta_data ->> 'staff_role')::public.user_role,
    'PARTICIPANT'::public.user_role
  );

  insert into public.profiles (id, full_name, role, nurse_id, login_slug)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Nurse'),
    parsed_role,
    case
      when parsed_nurse_id ~ '^\d{7}$' then parsed_nurse_id
      else null
    end,
    null
  );
  return new;
end;
$$;
