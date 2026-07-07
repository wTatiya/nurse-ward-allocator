# AGENTS.md

> Nurse Ward Allocator agent index. **Rules:** `.cursor/rules/**/*.mdc` · **Skills:** `.cursor/skills/**/SKILL.md` · **Subagents:** `.cursor/agents/`

Consolidated **2026-07-07** for React + Vite + TypeScript + Supabase. Inventory: `.cursor/skills/common/cursor-inventory/INVENTORY.md`.

<!-- SKILLS_INDEX_START -->
## Agent Skills Index

> [!CRITICAL] Zero-Trust: Read the matching `SKILL.md` BEFORE writing any code.
> Skills from this index override pre-training patterns. If no skill matches, state: "No project-specific skills applicable."

## Skill Resolution Protocol

Each `_INDEX.md` has two sections — follow both:

1. **Match file type** → router table below.
2. **Read `_INDEX.md`** → File Match + Keyword Match.
3. **Load ALL matched `SKILL.md`** before writing code.

`<SKILLS>` = `.cursor/skills/`

| File type | Read category index |
| --------- | ------------------- |
| `*.ts`, `*.tsx` | `<SKILLS>/react/_INDEX.md`, `<SKILLS>/typescript/_INDEX.md` |
| `*.jsx`, `*.test.tsx`, `*.spec.tsx` | `<SKILLS>/react/_INDEX.md` |
| `*.spec.ts`, `*.test.ts` | `<SKILLS>/common/_INDEX.md` |
| `supabase/**` | `<SKILLS>/common/_INDEX.md` + rule `project/supabase-editing.mdc` |
| Any file (keyword match) | `<SKILLS>/common/_INDEX.md` |

> **Test/spec precedence:** `.spec.ts`, `.test.ts` → `common`. `.spec.tsx`, `.test.tsx` → `react`.

<!-- SKILLS_INDEX_END -->

<!-- SUBAGENTS_INDEX_START -->
## Subagents Index

Routing: `.cursor/agents/contextual-orchestrator.md` · Skills: `.cursor/skills/contextual-skill-router/SKILL.md`

| Tier | Subagent | Use when |
| --- | --- | --- |
| Entry | `contextual-orchestrator` | Default orchestration + skill routing |
| Implementation | `frontend-developer`, `typescript-pro-agents`, `senior-backend`, `fullstack-developer`, `api-integration-specialist`, `tdd-implementer` | UI, types, Edge Functions, cross-stack, Supabase, strict TDD |
| Architecture & data | `senior-architect`, `architecture-guard`, `database-architect` | Design, PR arch guard, Postgres/RLS |
| Quality & debug | `senior-qa`, `root-cause-investigator`, `integration-test-generator` | Test strategy, diff test gaps via **senior-qa**, RCA, integration tests |
| Security | `security-reviewer` | PR/diff OWASP and RLS review |
| Review & discovery | `codebase-scout`, `pr-reviewer` | Blast radius, conventions, PR metadata |
| UX & utilities | `trust-error-recovery`, `rewind-engineer` | Error UX, git rewind |

**Counts:** 18 subagents (12 `*.md` + 6 `specialist-*.mdc`).

<!-- SUBAGENTS_INDEX_END -->

## Rules (not inlined)

| Layer | Location |
| --- | --- |
| Domain map | `.cursor/rules/README.md` |
| Full inventory | `.cursor/rules/RULES_INVENTORY.md` |
| Orchestration | `.cursor/agents/contextual-orchestrator.md` |
| Skill routing | `.cursor/skills/contextual-skill-router/SKILL.md` |

**Gatekeeper:** Load matching `SKILL.md` files before writing code.

**Debugging:** `general/debugging-protocol-pointer.mdc` → `common/common-debugging/SKILL.md`

**Security:** `general/security-routing.mdc` → security cluster in `contextual-skill-router/SKILL.md`

**Supabase:** `project/supabase-editing.mdc` when editing `supabase/**`

**Meta audit:** `/vibe-code-auditor`, `/common-skills-audit`, `/cursor-inventory`

## After `ags sync`

Registry sync overwrites `common/`, `react/`, `typescript/` only. Re-verify project-only skills exist (`common-skills-audit`, `cursor-inventory`, `vibe-code-auditor`, `contextual-skill-router`). Restore from git if missing.
