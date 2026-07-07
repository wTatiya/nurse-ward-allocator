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
