# AGENTS.md

> Nurse Ward Allocator agent index. **Rules:** `.cursor/rules/**/*.mdc` · **Skills:** `.cursor/skills/**/SKILL.md` · **Subagents:** `.cursor/agents/`

Consolidated **2026-07-09** for React + Vite + TypeScript + Supabase. Inventory: `.cursor/skills/common/cursor-inventory/INVENTORY.md` (regenerate via `/cursor-inventory`).

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

> [!TIP] **This project has the MCP server enabled in `.skillsrc`** — `sync` keeps your runtime configs in step. Run `ags mcp status` to verify per-agent installation.

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
| `*.ts`, `*.tsx` | `<SKILLS>/react/_INDEX.md`, `<SKILLS>/typescript/_INDEX.md`, `<SKILLS>/common/_INDEX.md` |
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

Registry sync overwrites `common/`, `react/`, `typescript/` only. **Always re-verify after sync:**

1. Project-only skills still on disk: `common-skills-audit`, `cursor-inventory`, `vibe-code-auditor`, `contextual-skill-router`, `vite-manual-chunks`, `web-performance-optimization`, `webapp-testing`
2. `_INDEX.md` project-only keyword rows intact (`common/_INDEX.md` bottom section)
3. No duplicate rule at `.cursor/rules/agent-skill-standard-rule.mdc` (canonical: `general/agent-skill-standard-rule.mdc`)
4. Run `/cursor-inventory` — expect **46 skills**, **3 commands**, **18 subagents**, **20 rules**
5. If meta skills missing: `git checkout HEAD -- .cursor/skills/common/common-skills-audit .cursor/skills/common/cursor-inventory .cursor/skills/common/vibe-code-auditor`

## Cursor Cloud specific instructions

Standard scripts live in `package.json` (`dev`, `build`, `lint`, `test`); the update
script already runs `npm install`. The notes below cover only non-obvious setup
needed to run the app **end-to-end**, since it requires a local Supabase backend.

### Services
- **Frontend (Vite SPA)** — `npm run dev` (add `-- --host 0.0.0.0` if you need
  the dev server reachable from outside localhost). Reads `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY` from a git-ignored `.env` (see below).
- **Supabase local stack** (Postgres + Auth + PostgREST + Realtime + Edge runtime)
  — started with `supabase start`. Requires Docker. The `run-assignment` Edge
  Function is served automatically by `supabase start`; you do NOT need a separate
  `supabase functions serve`.

### Backend startup (Docker + Supabase CLI are pre-installed in the snapshot)
1. Start the Docker daemon if it isn't running, then relax the socket perms:
   `sudo bash -c 'nohup dockerd >/var/log/dockerd.log 2>&1 &'` then
   `sudo chmod 666 /var/run/docker.sock`. Docker uses the `fuse-overlayfs`
   storage driver (configured in `/etc/docker/daemon.json`) and `iptables-legacy`.
2. `supabase start` (from repo root). Prints the local `API URL`, `anon key`,
   and `service_role key`. It applies all `supabase/migrations/**` and then runs
   `supabase/seed.sql`.
3. Create `.env` in the repo root (git-ignored) from the printed values:
   `VITE_SUPABASE_URL=http://127.0.0.1:54321` and `VITE_SUPABASE_ANON_KEY=<anon key>`.
4. Seed app data (order matters), passing the printed service_role key:
   `SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=<service_role> \`
   then `node scripts/seed-staff.mjs && node scripts/seed-participants.mjs && node scripts/seed-demo-round.mjs`.
5. `npm run dev` and open the app.

### Gotchas
- **Table grants (`supabase/seed.sql`):** Newer Supabase Postgres does NOT grant
  CRUD to `anon`/`authenticated`/`service_role` on new tables by default — only
  `TRUNCATE/REFERENCES/TRIGGER`. The migrations assume the older default, so
  without grants every PostgREST call fails with `permission denied for table ...`.
  `supabase/seed.sql` restores the grants and runs automatically on `supabase start`
  (fresh DB) and `supabase db reset`. It is local-only (never run by `supabase db push`
  or hosted deploys). If you add a brand-new table in a migration and hit
  `permission denied`, re-run the grants (or `supabase db reset`).
- **Login:** 7-digit nurse ID = username; for most accounts password = the ID.
  Seeded demo credentials: admin `5650414` / `1102002871008`; any participant
  uses its 7-digit ID as both fields (e.g. `5690564` / `5690564`). Nurse IDs map to
  internal emails `<id>@nurse.ward-allocator.local` (see `src/lib/nurseIdAuth.ts`).
- **Core flow:** participant submits 3 ranked wards on `/preferences`; admin on
  `/admin/rounds` closes the round then clicks "รันการเลือกตึก" to invoke the
  `run-assignment` Edge Function (writes assignments/waitlist/lottery_events).
- **`.env` is git-ignored** and not persisted by commits; recreate it after a fresh
  clone. Re-run the seed scripts after any `supabase db reset` (reset wipes app data
  but re-applies grants via `seed.sql`).
- UI is Thai-language; success banners are teal, errors are red.
