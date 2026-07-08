# Pre-Audit Checklist

Before scoring, confirm:

- [ ] Scope boundaries written (included/excluded paths)
- [ ] Stack detected (React/Supabase, Edge Functions, Postgres RLS, etc.)
- [ ] Entry points mapped (routes, Edge Functions, RLS policies, auth gates)
- [ ] Dependencies scanned (`package.json`, `functions/package.json`) for slopsquatting candidates
- [ ] No audit of secrets pasted in chat — flag location only
- [ ] Tests noted — absence affects Robustness score, not Security alone
- [ ] Scope is **application code** — if user asked about `.cursor/` skills/rules/agents, redirect to `common/common-skills-audit`

Stop and ask user for scope if only partial files visible.
