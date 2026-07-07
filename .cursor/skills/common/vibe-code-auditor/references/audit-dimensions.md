# Audit Dimensions — nurse-ward-allocator

## Security (30%)

Use `common/common-security-audit/references/vibe-security-scan.md`. For each hit:

1. Source → route → sink
2. Prove exploitability or mark hardening
3. Prefer framework-native fix

Project extras:
- RLS policies vs client queries (`supabase/migrations/`)
- Admin-only Edge Function paths (`run-assignment` auth + `profiles.role`)
- Service role key only server-side in Edge Functions
- CORS on Edge Functions (`Access-Control-Allow-Origin: *` — assess if acceptable)

## Architecture (25%)

- Logic in wrong layer (UI vs `_shared` engine vs Edge Function)
- God files (>500 UI lines)
- Client-side assignment/lottery logic (must stay server-side)
- Duplicate assignment engine copies drifting apart

Load `common/common-architecture-audit` when debt is structural.

## Robustness (25%)

- Unhandled promise rejections / missing error boundaries
- Race conditions on round status or assignment writes
- Auth/authz fail-open paths (client-only admin checks without RLS)
- Missing validation on preference submissions
- Realtime subscription cleanup in hooks

## Maintainability (20%)

- `any` types, dead code, commented-out blocks
- Missing tests on assignment engine changes
- Magic strings vs typed enums (`UserRole`, round statuses)
- Debug logs in production paths
- Config drift (`.env` vs hardcoded Supabase URLs)
