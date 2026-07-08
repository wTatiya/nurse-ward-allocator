-- Enable Supabase Realtime for assignment dashboard tables.
-- Without this, postgres_changes subscriptions never fire after manual edits.

alter publication supabase_realtime add table public.assignments;
alter publication supabase_realtime add table public.waitlist;
alter publication supabase_realtime add table public.lottery_events;
alter publication supabase_realtime add table public.preferences;
alter publication supabase_realtime add table public.assignment_rounds;
