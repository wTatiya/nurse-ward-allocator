-- ROB-02: Atomically replace assignment round results in one transaction.

create or replace function public.replace_round_results(
  p_round_id uuid,
  p_assignments jsonb,
  p_waitlist jsonb,
  p_lottery_events jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.assignments where round_id = p_round_id;
  delete from public.waitlist where round_id = p_round_id;
  delete from public.lottery_events where round_id = p_round_id;

  if coalesce(jsonb_array_length(p_assignments), 0) > 0 then
    insert into public.assignments (round_id, nurse_id, department_id, matched_tier)
    select
      p_round_id,
      item.nurse_id,
      item.department_id,
      item.matched_tier
    from jsonb_to_recordset(p_assignments) as item(
      nurse_id uuid,
      department_id uuid,
      matched_tier smallint
    );
  end if;

  if coalesce(jsonb_array_length(p_waitlist), 0) > 0 then
    insert into public.waitlist (round_id, nurse_id, position)
    select
      p_round_id,
      item.nurse_id,
      item.position
    from jsonb_to_recordset(p_waitlist) as item(
      nurse_id uuid,
      position integer
    );
  end if;

  if coalesce(jsonb_array_length(p_lottery_events), 0) > 0 then
    insert into public.lottery_events (
      round_id,
      department_id,
      tier,
      applicant_ids,
      winner_ids,
      slots,
      seed_hash
    )
    select
      p_round_id,
      item.department_id,
      item.tier,
      item.applicant_ids,
      item.winner_ids,
      item.slots,
      item.seed_hash
    from jsonb_to_recordset(p_lottery_events) as item(
      department_id uuid,
      tier smallint,
      applicant_ids uuid[],
      winner_ids uuid[],
      slots integer,
      seed_hash text
    );
  end if;
end;
$$;

revoke all on function public.replace_round_results(uuid, jsonb, jsonb, jsonb) from public;
grant execute on function public.replace_round_results(uuid, jsonb, jsonb, jsonb) to service_role;
