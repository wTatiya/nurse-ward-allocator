-- Nurse Ward Allocator schema

create extension if not exists "pgcrypto";

create type public.user_role as enum ('nurse', 'admin');
create type public.round_status as enum ('draft', 'open', 'closed', 'running', 'completed');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role public.user_role not null default 'nurse',
  created_at timestamptz not null default now()
);

create table public.wards (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  capacity integer not null check (capacity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.assignment_rounds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status public.round_status not null default 'draft',
  submission_deadline timestamptz,
  created_at timestamptz not null default now()
);

create table public.preferences (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.assignment_rounds (id) on delete cascade,
  nurse_id uuid not null references public.profiles (id) on delete cascade,
  choice_1 uuid not null references public.wards (id),
  choice_2 uuid not null references public.wards (id),
  choice_3 uuid not null references public.wards (id),
  submitted_at timestamptz not null default now(),
  unique (round_id, nurse_id),
  check (choice_1 <> choice_2 and choice_1 <> choice_3 and choice_2 <> choice_3)
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.assignment_rounds (id) on delete cascade,
  nurse_id uuid not null references public.profiles (id) on delete cascade,
  ward_id uuid not null references public.wards (id),
  matched_tier smallint not null check (matched_tier between 1 and 3),
  assigned_at timestamptz not null default now(),
  unique (round_id, nurse_id)
);

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.assignment_rounds (id) on delete cascade,
  nurse_id uuid not null references public.profiles (id) on delete cascade,
  position integer not null check (position > 0),
  created_at timestamptz not null default now(),
  unique (round_id, nurse_id),
  unique (round_id, position)
);

create table public.lottery_events (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.assignment_rounds (id) on delete cascade,
  ward_id uuid not null references public.wards (id),
  tier smallint not null check (tier between 1 and 3),
  applicant_ids uuid[] not null,
  winner_ids uuid[] not null,
  slots integer not null check (slots > 0),
  seed_hash text not null,
  created_at timestamptz not null default now()
);

create index preferences_round_id_idx on public.preferences (round_id);
create index assignments_round_id_idx on public.assignments (round_id);
create index waitlist_round_id_idx on public.waitlist (round_id);
create index lottery_events_round_id_idx on public.lottery_events (round_id);

alter table public.profiles enable row level security;
alter table public.wards enable row level security;
alter table public.assignment_rounds enable row level security;
alter table public.preferences enable row level security;
alter table public.assignments enable row level security;
alter table public.waitlist enable row level security;
alter table public.lottery_events enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'nurse'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create policy "Profiles are viewable by authenticated users"
on public.profiles for select
to authenticated
using (true);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Admins can update any profile"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Wards readable by authenticated users"
on public.wards for select
to authenticated
using (true);

create policy "Admins manage wards"
on public.wards for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Rounds readable by authenticated users"
on public.assignment_rounds for select
to authenticated
using (true);

create policy "Admins manage rounds"
on public.assignment_rounds for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Nurses read own preferences"
on public.preferences for select
to authenticated
using (nurse_id = auth.uid() or public.is_admin());

create policy "Nurses submit preferences while round is open"
on public.preferences for insert
to authenticated
with check (
  nurse_id = auth.uid()
  and exists (
    select 1
    from public.assignment_rounds r
    where r.id = round_id and r.status = 'open'
  )
);

create policy "Nurses update preferences while round is open"
on public.preferences for update
to authenticated
using (
  nurse_id = auth.uid()
  and exists (
    select 1
    from public.assignment_rounds r
    where r.id = round_id and r.status = 'open'
  )
)
with check (
  nurse_id = auth.uid()
  and exists (
    select 1
    from public.assignment_rounds r
    where r.id = round_id and r.status = 'open'
  )
);

create policy "Admins read all preferences"
on public.preferences for select
to authenticated
using (public.is_admin());

create policy "Assignments readable by owner or admin"
on public.assignments for select
to authenticated
using (nurse_id = auth.uid() or public.is_admin());

create policy "Waitlist readable by owner or admin"
on public.waitlist for select
to authenticated
using (nurse_id = auth.uid() or public.is_admin());

create policy "Lottery events readable by admins"
on public.lottery_events for select
to authenticated
using (public.is_admin());

insert into public.wards (name, capacity) values
  ('ICU', 3),
  ('Emergency', 4),
  ('Pediatrics', 3),
  ('Maternity', 2),
  ('Surgery', 4);
