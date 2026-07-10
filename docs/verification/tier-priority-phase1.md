# Tier Priority — Phase 1 Verification Checklist

Run in Supabase SQL editor for the affected production round. Replace literal UUIDs from step 5.1.

**Parameter substitution:** Supabase SQL editor does not support `:round_id` named binds. Run §5.1 first, copy the 18D `id` UUID, then paste literal UUIDs into all subsequent queries.

## Discover round (run first)

```sql
SELECT id, name, status, created_at
FROM assignment_rounds
ORDER BY created_at DESC
LIMIT 10;
```

Record the `round_id` tied to the 18D production report before running other queries.

## 5.1 Department and round

```sql
SELECT id, code, capacity FROM departments WHERE code = '18D';
```

Record `dept_18d_id` and `capacity`. Migration seeds **1**; `scripts/data/round-1-preferences.json` expects **3**. `scripts/seed-round-preferences.mjs` updates capacity when run (lines 95–117).

### Seed script capacity note

If `node scripts/seed-round-preferences.mjs` **did not run** before assignment, production 18D capacity may still be **1** (migration default). That alone causes a tier-1 lottery among 3 choice-1 nurses when seed JSON assumes capacity 3 with no lottery.

## 5.2 Preference tier map for 18D

```sql
SELECT p.nurse_id, pr.full_name,
  CASE WHEN p.choice_1 = '<dept_18d_id>' THEN 1
       WHEN p.choice_2 = '<dept_18d_id>' THEN 2
       WHEN p.choice_3 = '<dept_18d_id>' THEN 3 END AS rank_for_18d
FROM preferences p
JOIN profiles pr ON pr.id = p.nurse_id
WHERE p.round_id = '<round_id>'
  AND '<dept_18d_id>' IN (p.choice_1, p.choice_2, p.choice_3)
ORDER BY rank_for_18d, pr.full_name;
```

Record counts: choice-1 / choice-2 / choice-3 nurses for 18D.

## QA-P0-04: Tier-1 lottery existence for 18D

| choice1_count | capacity | tier-1 lottery row expected? |
|---------------|----------|------------------------------|
| ≤ capacity | C | **No** — all choice-1 nurses assigned directly |
| > capacity | C | **Yes** — lottery among choice-1 nurses only |

```sql
SELECT id, tier, slots, applicant_ids, winner_ids
FROM lottery_events
WHERE round_id = '<round_id>'
  AND department_id = '<dept_18d_id>'
  AND tier = 1;
```

**If UI showed a tier-1 lottery but this returns 0 rows:** display bug (fixed in `OutcomeExplanation` — lottery card gated on `step.lottery`, not raw `lottery_events.find`).

**If this returns a row but nurses believed to be choice-2 appear in roster:** run §5.3 violation query.

## 5.3 Tier-1 lottery roster integrity (MUST return 0 rows)

```sql
SELECT le.tier, applicant_id, p.choice_1
FROM lottery_events le
CROSS JOIN LATERAL unnest(le.applicant_ids) AS applicant_id
JOIN preferences p
  ON p.round_id = le.round_id AND p.nurse_id = applicant_id
WHERE le.round_id = '<round_id>'
  AND le.department_id = '<dept_18d_id>'
  AND le.tier = 1
  AND p.choice_1 <> '<dept_18d_id>';
```

**Alternative:** `JOIN preferences p ON p.nurse_id = ANY(le.applicant_ids)` with the same `WHERE` filters.

### EXPLAIN (investigation-only)

```sql
EXPLAIN ANALYZE
SELECT le.tier, applicant_id, p.choice_1
FROM lottery_events le
CROSS JOIN LATERAL unnest(le.applicant_ids) AS applicant_id
JOIN preferences p
  ON p.round_id = le.round_id AND p.nurse_id = applicant_id
WHERE le.round_id = '<round_id>'
  AND le.department_id = '<dept_18d_id>'
  AND le.tier = 1
  AND p.choice_1 <> '<dept_18d_id>';
```

If sequential scans dominate at scale, consider composite index on `lottery_events(round_id, department_id, tier)` (not required for typical round sizes).

## Winner subset assert (MUST return 0 rows)

```sql
SELECT le.id, le.winner_ids, le.applicant_ids
FROM lottery_events le
WHERE le.round_id = '<round_id>'
  AND le.department_id = '<dept_18d_id>'
  AND le.tier = 1
  AND NOT (le.winner_ids <@ le.applicant_ids);
```

## 5.4 Assignments vs preferences

```sql
SELECT a.nurse_id, a.matched_tier,
  CASE WHEN p.choice_1 = a.department_id THEN 1
       WHEN p.choice_2 = a.department_id THEN 2
       WHEN p.choice_3 = a.department_id THEN 3 END AS expected_tier
FROM assignments a
JOIN preferences p ON p.round_id = a.round_id AND p.nurse_id = a.nurse_id
WHERE a.round_id = '<round_id>' AND a.department_id = '<dept_18d_id>';
```

**ASSERT:** `matched_tier = expected_tier` for every row (unless manual admin edit after assignment).

## 5.5 Manual-operation suspects

```sql
SELECT a.nurse_id, a.matched_tier, a.department_id, p.choice_1, p.choice_2, p.choice_3
FROM assignments a
JOIN preferences p ON p.round_id = a.round_id AND p.nurse_id = a.nurse_id
WHERE a.round_id = '<round_id>' AND a.matched_tier = 3
  AND a.department_id IN (p.choice_1, p.choice_2);
```

## Local replay (no DB)

```bash
node scripts/verify-tier-priority.mjs
node scripts/replay-assignment-round.mjs
npm test -- src/lib/assignment-engine.test.ts src/lib/replay-assignment.test.ts
```

See [replay-assignment-round.md](./replay-assignment-round.md) for exporting production preferences into a fixture.

## Local seed analysis (18D)

| Tier | Count (round-1-preferences.json) |
|------|----------------------------------|
| choice1 = 18D | 3 |
| choice2 = 18D | 2 |
| choice3 = 18D | 2 |

With capacity **3**: no tier-1 lottery (all three tier-1 nurses assigned directly).  
With capacity **1**: tier-1 lottery among 3 nurses only; tier-2/3 nurses never in tier-1 `applicant_ids`.

## Manual UAT checklist (P2)

For one nurse with 18D as **choice 2** (e.g. ณัฐพร or ชณัฐชา from seed):

1. **Admin → บันทึกการจับสลาก:** tier-1 event for 18D (if any) lists only choice-1 nurses with rank label "อันดับ 1".
2. **Nurse → เส้นทางของคุณ:** choice-2 nurse sees "ตำแหน่งเต็ม" at tier 1 for 18D **without** a lottery detail card.
3. **Results table:** choice-2 nurse assigned to 18D shows `matched_tier` = อันดับ 2 (not 1).

## Decision matrix

| Violation query | Manual edits | Next action |
|-----------------|--------------|-------------|
| 0 rows | No | Display clarity (Phase 4a) — implemented |
| 0 rows | Yes | Fix manual `matched_tier` (Phase 4b) — implemented |
| Rows found | — | Engine fix (Phase 3) |
| No tier-1 lottery row but UI showed lottery | — | OutcomeExplanation gating (Phase 4a) — implemented |
