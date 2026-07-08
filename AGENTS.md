# AGENTS.md

> Nurse Ward Allocator agent index. **Rules:** `.cursor/rules/**/*.mdc` · **Skills:** `.cursor/skills/**/SKILL.md` · **Subagents:** `.cursor/agents/`

Consolidated **2026-07-08** for React + Vite + TypeScript + Supabase. Inventory: `.cursor/skills/common/cursor-inventory/INVENTORY.md` (regenerate via `/cursor-inventory`).

<!-- SKILLS_INDEX_START -->
## Agent Skills Index

> [!CRITICAL] Zero-Trust: Read the matching `SKILL.md` BEFORE writing any code.
> Skills from this index override pre-training patterns. If no skill matches, state: "No project-specific skills applicable."

> 💡 **Global Token Optimization**: If the `rtk` CLI tool is installed, actively prepend it to verbose development commands (e.g. `rtk npm test`, `rtk grep`). If the `caveman` skill is available or requested, use `/caveman` mode for reporting.

## 🔌 Runtime Enforcement via MCP

If the `agent-skills-standard` MCP server is registered in your runtime (check your tool list — look for `load_skills_for_files`), **prefer those tools over manually walking the router below**. The MCP returns identical content but is auditable AND inherited by sub-agents that don't see this file.

| Tool | When to call it |
| --- | --- |
| `list_workflows()` | At the start of any task or session to discover available standard operating procedures |
| `get_workflow(name)` | Once a relevant workflow is identified to retrieve exact step-by-step instructions |
| `load_skills_for_files(files=[...])` | Before editing/reviewing any source file |
| `load_skills_for_keywords(keywords=[...])` | Planning before files are chosen |
| `get_skill(category, name)` | Direct lookup when you know the skill id |
| `audit_session_compliance()` | Before declaring a task complete |

> [!IMPORTANT] **Sub-agents don't inherit this `AGENTS.md` — they do inherit the MCP.** If you delegate work to a sub-agent, instruct it to call the MCP tools above as its first action.

> [!NOTE] To enable MCP-managed installs in this project, run `ags mcp enable` (or edit `.skillsrc`). The MCP works fine if you registered it manually too.

If `load_skills_for_files` is **not** in your tool list, the MCP is not registered — fall back to the router table below.

---

## Skill Resolution Protocol

Each `_INDEX.md` has two sections - follow both:

1. **Match file type** -> find the category index in the router table below.
2. **Read the `_INDEX.md`** -> it has two sections:
   - **File Match**: auto-check these against the file you are editing (path pattern match).
   - **Keyword Match**: only check if the user's request mentions these concepts.
3. **Load ALL matched `SKILL.md`** -> read every matched skill before writing code. The tier model keeps matches focused.

> `<SKILLS>` = your agent's skill directory (e.g., `.claude/skills/`, `.cursor/skills/`, `.gemini/skills/`).

| File type | Read category index |
| --------- | ------------------- |
| `*.ts`, `*.tsx` | `<SKILLS>/react/_INDEX.md`, `<SKILLS>/typescript/_INDEX.md` |
| `*.jsx`, `*.test.tsx`, `*.spec.tsx` | `<SKILLS>/react/_INDEX.md` |
| `*.spec.ts`, `*.test.ts` | `<SKILLS>/common/_INDEX.md` |
| Any file (keyword match) | `<SKILLS>/common/_INDEX.md` |

> [!NOTE] **Test/spec file precedence:** `.spec.ts`, `.test.ts` -> use the `common` row (takes precedence over the generic `*.ts` row). `.spec.tsx`, `.test.tsx` -> use the `react` row (takes precedence over the generic `*.tsx` row).

> [!TIP] **Indirect phrasing counts.** "make it faster" -> performance, "broken query" -> database, "login flow" -> auth.

### Project-only skills (not in registry sync — load by keyword)

| Skill | When |
| --- | --- |
| `contextual-skill-router` | Phase 0 orchestration / skill routing |
| `vite-manual-chunks` | Vite `manualChunks`, chunk size warnings |
| `web-performance-optimization` | Core Web Vitals, Lighthouse |
| `webapp-testing` | Playwright E2E patterns |
| `common/cursor-inventory` | `/cursor-inventory`, skills catalog |
| `common/common-skills-audit` | `/common-skills-audit`, agent config cleanup |
| `common/vibe-code-auditor` | `/vibe-code-auditor`, app production readiness |

<!-- SKILLS_INDEX_END -->

<!-- SUBAGENTS_INDEX_START -->
## Subagents Index

Routing: `.cursor/agents/contextual-orchestrator.md` · Skills: `.cursor/skills/contextual-skill-router/SKILL.md`

| Tier | Subagent (`Task` id) | File | Use when |
| --- | --- | --- | --- |
| Entry | `contextual-orchestrator` | `contextual-orchestrator.md` | Default orchestration + skill routing |
| Implementation | `frontend-developer`, `typescript-pro-agents`, `senior-backend`, `fullstack-developer`, `api-integration-specialist`, `tdd-implementer` | `*.md` + `specialist-tdd-implementer.mdc` | UI, types, Edge Functions, cross-stack, Supabase, strict TDD |
| Architecture & data | `senior-architect`, `architecture-guard`, `database-architect` | `*.md` + `specialist-architecture-guard.mdc` | Design, PR arch guard, Postgres/RLS |
| Quality & debug | `senior-qa`, `root-cause-investigator`, `integration-test-generator` | `*.md` + `specialist-integration-test-generator.mdc` | Test strategy, diff test gaps via **senior-qa**, RCA, integration tests |
| Security | `security-reviewer` | `specialist-security-reviewer.mdc` | PR/diff OWASP and RLS review |
| Review & discovery | `codebase-scout`, `pr-reviewer` | `specialist-*.mdc` | Blast radius, conventions, PR metadata |
| UX & utilities | `trust-error-recovery`, `rewind-engineer` | `*.md` | Error UX, git rewind |

**Counts:** 18 subagents (12 `*.md` + 6 `specialist-*.mdc`). Built-in `explore` for broad discovery.

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
