# Pattern Shortcuts — nurse-ward-allocator

Stack-aware greps. Evidence only — do not claim without reading matches.

## Secrets

```
rg -i "(api[_-]?key|secret|password|private[_-]?key|BEGIN (RSA |EC )?PRIVATE)" --glob '!node_modules' --glob '!.cursor' --glob '!.env'
```

## Supabase / backend

```
rg "SUPABASE_SERVICE_ROLE|serviceRole|createClient" supabase/ src/
rg "ENABLE ROW LEVEL SECURITY|CREATE POLICY" supabase/migrations/
rg "from\('|\.rpc\(" src/ supabase/
```

## React

```
rg "useEffect\(" src/ --glob '*.tsx'
rg ": any|as any" src/ --glob '*.{ts,tsx}'
rg "console\.(log|debug)" src/ --glob '*.{ts,tsx}'
rg "dangerouslySetInnerHTML" src/
```

## Auth gaps

```
rg "role.*admin|profiles" src/ supabase/
# Cross-check: admin UI actions backed by RLS, not client-only
```

## Assignment fairness

```
rg "Math\.random|runAssignment" src/ supabase/
# Lottery must use crypto in Edge Function, not client Math.random
```

## RLS privilege escalation (P0 patterns)

```
rg "Users can update own profile|auth\.uid\(\) = id" supabase/migrations/
# WITH CHECK must block role column changes on profiles
rg "staff_role|raw_user_meta_data" supabase/migrations/
# Never trust signup metadata for role assignment
```

## Assignment robustness

```
rg "delete\(\)|\.delete\(" supabase/functions/run-assignment/
# Re-run must not delete results before successful insert
rg "new Date\(\)\.toISOString\(\)" supabase/functions/
# Seed hash must be deterministic for audit verification
```
