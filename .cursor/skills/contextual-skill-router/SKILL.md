---
name: contextual-skill-router
description: Routes every new request to correct project skills and subagents using AGENTS index, file context, and task intent. Use when starting any request (Phase 0 orchestration) before domain execution.
---

# Contextual Skill Router

Meta-skill only: decide what to load; do not solve tasks directly.

## Sources of Truth (in order)

1. `AGENTS.md` skill index and zero-trust protocol.
2. Active workspace rules in `.cursor/rules/**/*.mdc`.
3. Installed skill files in `.cursor/skills/**/SKILL.md`.
4. Subagents in `.cursor/agents/` (18 files — see orchestrator).

## Mandatory Routing Flow

1. Read user intent + active file context.
2. Read `AGENTS.md`, then load matching `SKILL.md` files.
3. Load all matches (not first-match only).
4. Decide direct tools vs subagent escalation.
5. Pre-write audit + post-write self-scan.

## Domain-to-Skill Map

- `ui_frontend`: `react/*`, `common/common-accessibility`
- `backend_api`: `common/common-api-design`, `common/common-error-handling`, `common/common-debugging`
- `supabase_backend`: `project/supabase-editing` + `common/common-security-standards`
- `testing_qa`: `react/react-testing`, `common/common-tdd`, `webapp-testing`
- `performance`: `web-performance-optimization`, `react/react-performance`, `vite-manual-chunks`, `common/common-performance-engineering`
- `security`: `common/common-owasp`, `common/common-security-audit`, `react/react-security`, `typescript/typescript-security`
- `architecture_refactor`: `common/common-system-design`, `common/common-architecture-audit`, `common/vibe-code-auditor`
- `docs_plans`: `common/common-documentation`, `common/common-product-requirements`
- `meta_config`: `common/common-skills-audit`, `common/cursor-inventory`, `common/vibe-code-auditor`

## Rule-Aware Priority Boosters

- Supabase/RLS/Edge Function → `project/supabase-editing.mdc` + security cluster
- Assignment/lottery fairness → `supabase/functions/_shared/` + tests
- Bugs → `common/common-debugging` + `root-cause-investigator`
- Reviews → `common/common-code-review` + appropriate specialist
- Agent config audit → `common/common-skills-audit`
- App production readiness → `common/vibe-code-auditor`

## Subagent Escalation Map (18 on disk)

- `contextual-orchestrator` — default entry
- `codebase-scout`, `pr-reviewer`, `security-reviewer`, `architecture-guard` — review
- `database-architect`, `senior-backend`, `api-integration-specialist` — backend/Supabase
- `frontend-developer`, `fullstack-developer`, `typescript-pro-agents`, `senior-architect` — implementation
- `senior-qa` (diff test-gap mode), `integration-test-generator`, `tdd-implementer` — quality
- `root-cause-investigator`, `trust-error-recovery`, `rewind-engineer` — debug/UX/utilities

Do **not** route to removed enterprise agents: `specialist-jira-analyst`, `specialist-confluence-searcher`, `specialist-zephyr-scanner`, `specialist-tc-creator`, `specialist-ac-verifier`, `specialist-pr-commenter-batch`, `specialist-logic-hacker`, `specialist-mobile-reverser`, `specialist-aspm-correlator`, `specialist-test-gap-finder`. Use `senior-qa` diff mode for test-gap review.

Full registry: `.cursor/agents/contextual-orchestrator.md`.

## Fallback

`common/common-best-practices` + nearest domain skill.
