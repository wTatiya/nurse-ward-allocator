---
name: vibe-code-auditor
description: Audits AI-generated, prototype, or vibe-coded software for production readiness — security, architecture, robustness, and technical debt. Evidence-backed report with score. Use when user runs /vibe-code-auditor, asks to productionize prototype code, or review vibe-coded changes.
disable-model-invocation: true
---

# Vibe Code Auditor

## **Priority: P1**

Read-only production-readiness audit for **application code** (not `.cursor/` config — use `common/common-skills-audit` for agent layer).

## Scope resolution

1. User `$ARGUMENTS` path or @-mentions
2. Active editor tabs
3. Recent git diff when user implies "my changes"
4. Default scope for this project: **`src/`**, **`supabase/`** (migrations, Edge Functions, `_shared/`)
5. If still none: ask once for path — then stop

## Workflow

1. **Pre-audit** — [references/pre-audit-checklist.md](references/pre-audit-checklist.md)
2. **Scan dimensions** — [references/audit-dimensions.md](references/audit-dimensions.md) (security uses `common/common-security-audit/references/vibe-security-scan.md`)
3. **Pattern shortcuts** — [references/pattern-shortcuts.md](references/pattern-shortcuts.md)
4. **Score** — [references/scoring-rubric.md](references/scoring-rubric.md)
5. **Report** — [references/output-format.md](references/output-format.md) only
6. **Do not rewrite code** unless user explicitly asks to fix findings

## Project default scope (nurse-ward-allocator)

- `src/` — React client, hooks, Supabase client usage
- `supabase/migrations/` — Postgres schema and RLS
- `supabase/functions/` — Edge Functions (assignment lottery must stay server-side)

Last stack audit baseline: **2026-07-10** (tier-priority + manual assignment changes).

## Escalation

| Finding depth | Load |
| --- | --- |
| Security exploit paths | `common/common-security-audit` |
| Architecture / layer debt | `common/common-architecture-audit` |
| PR/diff review tone | `common/common-code-review` |

## Anti-patterns

- No score without cited file:line evidence
- No P0 without reachability note
- No fixing code during audit-only invocation
- No conflating agent-config audit with app audit

## References

- [Pre-audit checklist](references/pre-audit-checklist.md)
- [Audit dimensions](references/audit-dimensions.md)
- [Pattern shortcuts](references/pattern-shortcuts.md)
- [Scoring rubric](references/scoring-rubric.md)
- [Output format](references/output-format.md)
