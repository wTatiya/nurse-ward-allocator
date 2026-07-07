-- Hospital staff roles, departments, LOF mapping, and scoped visibility

-- Expand user_role enum (Postgres: add values then migrate)
alter type public.user_role rename to user_role_old;

create type public.user_role as enum (
  'ADMIN',
  'MANAGER',
  'HEAD_NURSE',
  'VICE_HEAD_NURSE',
  'SUPERVISOR_NURSE',
  'HEAD_WARD_NURSE',
  'PARTICIPANT'
);

alter table public.profiles
  alter column role drop default;

alter table public.profiles
  alter column role type public.user_role
  using (
    case role::text
      when 'admin' then 'ADMIN'::public.user_role
      when 'nurse' then 'PARTICIPANT'::public.user_role
      else 'PARTICIPANT'::public.user_role
    end
  );

alter table public.profiles
  alter column role set default 'PARTICIPANT'::public.user_role;

drop type public.user_role_old;

-- Wards -> departments
alter table public.wards rename to departments;

alter table public.departments
  add column if not exists code text,
  add column if not exists name_th text;

update public.departments
set
  code = name,
  name_th = name
where code is null;

alter table public.departments
  alter column code set not null;

create unique index if not exists departments_code_key on public.departments (code);

alter table public.assignments rename column ward_id to department_id;
alter table public.lottery_events rename column ward_id to department_id;

alter table public.departments drop column if exists name;

-- LOF mapping
create table if not exists public.lof_departments (
  lof_id text not null,
  department_id uuid not null references public.departments (id) on delete cascade,
  primary key (lof_id, department_id)
);

create index if not exists lof_departments_lof_id_idx on public.lof_departments (lof_id);

-- Staff department scope
create table if not exists public.profile_departments (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  department_id uuid not null references public.departments (id) on delete cascade,
  primary key (profile_id, department_id)
);

create index if not exists profile_departments_profile_id_idx
  on public.profile_departments (profile_id);

-- Replace generic seed wards with hospital departments
truncate table public.departments cascade;

insert into public.departments (code, name_th, capacity, is_active) values
  ('18A', 'สามัญสูติกรรม (18A)', 1, true),
  ('18B', 'สามัญนรีเวชกรรม และศัลยกรรมหญิง (18B)', 1, true),
  ('18C', 'สามัญ EENT (18C)', 1, true),
  ('18D', 'สามัญกุมารเวชกรรม (18D)', 1, true),
  ('19A', 'สามัญอายุรกรรมชาย 3 (19A)', 1, true),
  ('19B', 'สามัญศัลยกรรมกระดูกและข้อขาย (19B)', 1, true),
  ('19C', 'ศัลยกรรมอุบัติเหตุหญิง (19C)', 1, true),
  ('19D', 'สามัญศัลยกรรมศัลยกรรมกระดูกและข้อหญิง (19D)', 1, true),
  ('20B', 'ศัลยกรรมอุบัติเหตุชาย (20B)', 1, true),
  ('20C', 'สามัญศัลยกรรมชาย (20C)', 1, true),
  ('21A', '21A', 1, true),
  ('21D', 'เคมีบำบัด (21D)', 1, true),
  ('22A', 'สามัญอายุรกรรมหญิง 1 (22A)', 1, true),
  ('22B', 'สามัญอายุรกรรมชาย 1 (22B)', 1, true),
  ('22C', 'สามัญอายุรกรรมชาย 2 (22C)', 1, true),
  ('22D', 'สามัญอายุรกรรมหญิง 2 (22D)', 1, true),
  ('23A', 'พิเศษสูติกรรม (23A)', 1, true),
  ('24A', 'พิเศษอายุรกรรม (24A)', 1, true),
  ('25A', 'พิเศษศัลยกรรมกระดูกและข้อ (25A)', 1, true),
  ('25B', 'พิเศษศัลยกรรม (25B)', 1, true),
  ('26B', 'พิเศษทั่วไป (26B)', 1, true),
  ('BLO_BNK', 'หน่วยรับบริจาคโลหิต & คลินึกปฐมภูมิ และ คลินิกจิตเวช', 1, true),
  ('BURN', 'Burn unit', 1, true),
  ('CCU', 'วิกฤตโรคหัวใจและหลอดเลือด (CCU)', 1, true),
  ('CSSD', 'หน่วยจ่ายกลาง', 1, true),
  ('DR', 'ตึกคลอด', 1, true),
  ('ECC', 'ศูนย์ส่งเสริมฟื้นฟูสุขภาพผู้สูงอายุ', 1, true),
  ('ERD', 'หน่วยอุบัติเหตุและฉุกเฉิน (ER)', 1, true),
  ('G10', 'ห้องผ่าตัดเล็กและห้องส่องกล้อง', 1, true),
  ('HD', 'หน่วยไตเทียม', 1, true),
  ('MICU', 'วิกฤตอายุรกรรม (MICU)', 1, true),
  ('NICU', 'ทารกแรกเกิด และทารกแรกเกิดวิกฤต/NICU', 1, true),
  ('NSO', 'สำนักงานฝ่ายการพยาบาล', 1, true),
  ('OPD_CHEMO', 'คลินิกมะเร็ง', 1, true),
  ('OPD_GENP', 'คลินิกเวชปฏิบัติ', 1, true),
  ('OPD_MED', 'คลินิกอายุรกรรม & Meta & DM', 1, true),
  ('OPD_OBGYN', 'คลินิกสูติ-นรีเวชกรรม และกุมารเวชกรรม', 1, true),
  ('OPD_PC', 'คลินิกจิตเวช', 1, true),
  ('OPD_Primary', 'คลินิกปฐมภูมิ', 1, true),
  ('OPD_SxOrthoEENT', 'คลินิกศัลยกรรม ศัลยกรรมกระดูกและข้อ และคลินิก EENT', 1, true),
  ('OPD3', 'OPD3', 1, true),
  ('OR', 'ห้องผ่าตัด', 1, true),
  ('SICU', 'วิกฤตศัลยกรรม (SICU)', 1, true),
  ('STR', 'Stroke unit', 1, true),
  ('SW', 'ตึกสว่างวัฒนา', 1, true);

insert into public.lof_departments (lof_id, department_id)
select v.lof_id, d.id
from (
  values
    ('OBGYN', '18A'),
    ('OBGYN', '18B'),
    ('SUR2', '18C'),
    ('SPE', '18D'),
    ('MED2', '19A'),
    ('SUR1', '19B'),
    ('SUR1', '19C'),
    ('SUR1', '19D'),
    ('ER', '20B'),
    ('ER', '20C'),
    ('SPE', '21A'),
    ('SPE', '21D'),
    ('MED1', '22A'),
    ('MED2', '22B'),
    ('MED2', '22C'),
    ('MED1', '22D'),
    ('OBGYN', '23A'),
    ('MED2', '24A'),
    ('SUR1', '25A'),
    ('SUR2', '25B'),
    ('SUR2', '26B'),
    ('OPD3', 'BLO_BNK'),
    ('ICU', 'BURN'),
    ('ICU', 'CCU'),
    ('OR_LOF', 'CSSD'),
    ('OBGYN', 'DR'),
    ('OPD3', 'ECC'),
    ('ER', 'ERD'),
    ('OR_LOF', 'G10'),
    ('OPD2', 'HD'),
    ('ICU', 'MICU'),
    ('SPE', 'NICU'),
    ('NSO', 'NSO'),
    ('SPE', 'OPD_CHEMO'),
    ('OPD1', 'OPD_GENP'),
    ('OPD2', 'OPD_MED'),
    ('OPD2', 'OPD_OBGYN'),
    ('OPD3', 'OPD_PC'),
    ('OPD3', 'OPD_Primary'),
    ('OPD1', 'OPD_SxOrthoEENT'),
    ('OPD3', 'OPD3'),
    ('OR_LOF', 'OR'),
    ('ICU', 'SICU'),
    ('MED1', 'STR'),
    ('MED1', 'SW')
) as v(lof_id, code)
join public.departments d on d.code = v.code;

-- Auth helpers
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
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

create or replace function public.is_staff_viewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in (
        'ADMIN',
        'MANAGER',
        'HEAD_NURSE',
        'VICE_HEAD_NURSE',
        'SUPERVISOR_NURSE',
        'HEAD_WARD_NURSE'
      )
  );
$$;

create or replace function public.visible_department_ids()
returns setof uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  viewer_role public.user_role;
  has_nso boolean;
begin
  select role into viewer_role from public.profiles where id = auth.uid();
  if viewer_role is null then
    return;
  end if;

  if viewer_role = 'ADMIN' then
    return query select id from public.departments;
    return;
  end if;

  select exists (
    select 1
    from public.profile_departments pd
    join public.departments d on d.id = pd.department_id
    where pd.profile_id = auth.uid() and d.code = 'NSO'
  ) into has_nso;

  if viewer_role in ('MANAGER', 'HEAD_NURSE', 'VICE_HEAD_NURSE') and has_nso then
    return query select id from public.departments;
    return;
  end if;

  if viewer_role = 'SUPERVISOR_NURSE' then
    return query
    select distinct ld.department_id
    from public.profile_departments pd
    join public.lof_departments ld_self on ld_self.department_id = pd.department_id
    join public.lof_departments ld on ld.lof_id = ld_self.lof_id
    where pd.profile_id = auth.uid();
    return;
  end if;

  return query
  select pd.department_id
  from public.profile_departments pd
  where pd.profile_id = auth.uid();
end;
$$;

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

  insert into public.profiles (id, full_name, role, nurse_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Nurse'),
    parsed_role,
    case
      when parsed_nurse_id ~ '^\d{7}$' then parsed_nurse_id
      else null
    end
  );
  return new;
end;
$$;

-- RLS: departments
drop policy if exists "Wards readable by authenticated users" on public.departments;
drop policy if exists "Admins manage wards" on public.departments;

create policy "Departments visible to scoped staff"
on public.departments for select
to authenticated
using (
  public.is_admin()
  or id in (select public.visible_department_ids())
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'PARTICIPANT'
  )
);

create policy "Admins manage departments"
on public.departments for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- profile_departments
alter table public.profile_departments enable row level security;

create policy "Users read own department links"
on public.profile_departments for select
to authenticated
using (profile_id = auth.uid() or public.is_admin() or public.is_staff_viewer());

create policy "Admins manage profile departments"
on public.profile_departments for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- lof_departments read for authenticated staff
alter table public.lof_departments enable row level security;

create policy "LOF mapping readable by staff"
on public.lof_departments for select
to authenticated
using (public.is_staff_viewer() or public.is_admin());

-- assignments / lottery scoped reads for dashboard
drop policy if exists "Assignments readable by owner or admin" on public.assignments;

create policy "Assignments readable by owner admin or scoped staff"
on public.assignments for select
to authenticated
using (
  nurse_id = auth.uid()
  or public.is_admin()
  or department_id in (select public.visible_department_ids())
);

drop policy if exists "Lottery events readable by admins" on public.lottery_events;

create policy "Lottery events readable by admin and scoped staff"
on public.lottery_events for select
to authenticated
using (
  public.is_admin()
  or department_id in (select public.visible_department_ids())
);

drop policy if exists "Nurses read own preferences" on public.preferences;
drop policy if exists "Admins read all preferences" on public.preferences;

create policy "Preferences readable by owner admin or staff viewers"
on public.preferences for select
to authenticated
using (
  nurse_id = auth.uid()
  or public.is_admin()
  or public.is_staff_viewer()
);

drop policy if exists "Waitlist readable by owner or admin" on public.waitlist;

create policy "Waitlist readable by owner admin or staff viewers"
on public.waitlist for select
to authenticated
using (
  nurse_id = auth.uid()
  or public.is_admin()
  or public.is_staff_viewer()
);

-- Dashboard stats view (scoped to visible departments for staff viewers)
create or replace view public.department_round_stats
with (security_invoker = true) as
select
  r.id as round_id,
  r.name as round_name,
  r.status as round_status,
  d.id as department_id,
  d.code as department_code,
  d.name_th as department_name,
  d.capacity,
  (
    select count(*)::integer
    from public.assignments a
    where a.round_id = r.id and a.department_id = d.id
  ) as assigned_count,
  (
    select count(*)::integer
    from public.preferences p
    where p.round_id = r.id
      and (p.choice_1 = d.id or p.choice_2 = d.id or p.choice_3 = d.id)
  ) as preference_mentions,
  (
    select count(*)::integer
    from public.lottery_events le
    where le.round_id = r.id and le.department_id = d.id
  ) as lottery_event_count
from public.assignment_rounds r
cross join public.departments d
where d.id in (select public.visible_department_ids());

grant select on public.department_round_stats to authenticated;
