-- Local development seed (Supabase CLI only).
--
-- This file is executed automatically by `supabase start` (on a fresh database)
-- and by `supabase db reset`, AFTER all migrations are applied. It is NOT run by
-- `supabase db push` or hosted deployments, so it only affects local dev.
--
-- Why this exists:
-- Newer Supabase Postgres images no longer grant CRUD (SELECT/INSERT/UPDATE/
-- DELETE) to the PostgREST API roles (anon, authenticated, service_role) by
-- default -- fresh tables only receive TRUNCATE/REFERENCES/TRIGGER. The app's
-- migrations rely on the older Supabase default that granted table CRUD (Row
-- Level Security still gates actual access via the policies in the migrations).
-- Without these grants, every PostgREST request fails with
-- "permission denied for table ...". We restore the expected grants here so the
-- local stack mirrors the hosted project the app was built against.

grant usage on schema public to anon, authenticated, service_role;

grant all privileges on all tables in schema public
  to anon, authenticated, service_role;
grant all privileges on all sequences in schema public
  to anon, authenticated, service_role;
grant execute on all functions in schema public
  to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;
