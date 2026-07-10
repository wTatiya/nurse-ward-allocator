-- Staff viewers (non-participants) see full hospital results read-only.
-- Write access remains admin-only via existing policies.

create or replace function public.visible_department_ids()
returns setof uuid
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.is_staff_viewer() then
    return query select id from public.departments;
    return;
  end if;

  return;
end;
$$;
