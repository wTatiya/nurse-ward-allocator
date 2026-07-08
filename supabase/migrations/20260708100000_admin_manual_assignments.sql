-- Allow admins to manually assign waitlisted nurses and adjust placements offline.

create policy "Admins manage assignments"
on public.assignments for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage waitlist"
on public.waitlist for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
