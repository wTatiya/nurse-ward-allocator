-- Allow admins to archive completed rounds (hide from default views)

alter table public.assignment_rounds
  add column if not exists archived_at timestamptz;

create index if not exists assignment_rounds_archived_at_idx
  on public.assignment_rounds (archived_at)
  where archived_at is not null;

drop policy if exists "Rounds readable by authenticated users" on public.assignment_rounds;

create policy "Rounds readable by authenticated users"
on public.assignment_rounds for select
to authenticated
using (archived_at is null or public.is_admin());
