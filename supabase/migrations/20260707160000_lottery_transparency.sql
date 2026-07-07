-- Let participants read lottery events they took part in (for outcome transparency)

create policy "Participants read own lottery events"
on public.lottery_events for select
to authenticated
using (
  auth.uid() = any (applicant_ids)
  or auth.uid() = any (winner_ids)
);
