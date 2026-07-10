# Replay assignment round offline

Compare `runAssignmentEngine` output against production `lottery_events` and `assignments` without re-running the Edge Function.

## Export production data (Supabase SQL editor)

Replace `<round_id>` with the affected round UUID.

### Preferences

```sql
SELECT nurse_id, choice_1, choice_2, choice_3, submitted_at
FROM preferences
WHERE round_id = '<round_id>';
```

### Departments (active only, as Edge Function loads)

```sql
SELECT id, code, capacity
FROM departments
WHERE is_active = true
ORDER BY code;
```

### Optional: compare against stored results

```sql
SELECT nurse_id, department_id, matched_tier FROM assignments WHERE round_id = '<round_id>';
SELECT department_id, tier, applicant_ids, winner_ids, slots FROM lottery_events WHERE round_id = '<round_id>';
```

Save query results as JSON or use Supabase table export. Fixture shape for `scripts/data/replay-fixture.json`:

```json
{
  "roundId": "uuid",
  "wards": [{ "id": "dept-uuid", "capacity": 3 }],
  "preferences": [
    {
      "nurseId": "nurse-uuid",
      "choice1": "dept-uuid",
      "choice2": "dept-uuid",
      "choice3": "dept-uuid"
    }
  ],
  "expected": {
    "assignments": [],
    "lotteryEvents": []
  }
}
```

`expected` is optional — when present, `replay-assignment-round.mjs` diffs engine output vs fixture.

## Run local replay

```bash
# Seed-shaped smoke test (no fixture file needed)
node scripts/replay-assignment-round.mjs

# Production fixture (after export)
node scripts/replay-assignment-round.mjs scripts/data/replay-fixture.json
```

Engine regression is also covered by:

```bash
npm test -- src/lib/replay-assignment.test.ts
```

Assignment persistence from the Edge Function uses `replace_round_results` (single Postgres transaction) so a failed insert rolls back prior deletes for that round.

## Interpreting diffs

| Diff type | Likely cause |
|-----------|--------------|
| Tier-1 `applicant_ids` include choice-2 nurse | Engine bug (unlikely — see assignment-engine tests) |
| No tier-1 lottery in DB but engine produces one | Capacity changed after assignment / wrong export |
| `matched_tier` mismatch only | Manual `assignFromWaitlist` / `reassignParticipant` before fix |
| Engine matches fixture `expected` | Production data consistent with algorithm |
