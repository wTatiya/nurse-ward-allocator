# Nurse Ward Allocator — Cursor rules

Short editor rules in `*.mdc` under `.cursor/rules/general/` and `.cursor/rules/project/`.

Deep procedures: `.cursor/skills/**/SKILL.md` · Index: `AGENTS.md`

**Baseline (2026-07-10):** 46 skills · 18 subagents · 20 rules · 3 slash commands

## Decision tree

1. **Every turn** — `alwaysApply: true` rules (protocol, repo map, security routing).
2. **Matched files** — glob rules (`src/**`, `supabase/**`, `vite.config.ts`).
3. **Skills** — `AGENTS.md` + matching `SKILL.md` before coding.
4. **Multi-step** — `contextual-orchestrator` + subagents.

## Domains

| Domain | Rules | Skills |
| --- | --- | --- |
| Protocol | `agent-skill-standard-rule`, `orchestrator-subagent` | `common-protocol-enforcement` |
| Debugging | `debugging-protocol-pointer` | `common-debugging` |
| Coding | `repo-coding-debugging`, `repo-context-map` | `common-best-practices`, `react/*`, `typescript/*` |
| Security | `security-routing` | `common-owasp`, `common-security-audit` |
| Supabase | `project/supabase-editing` | `common-error-handling` |
| UI | `ui-design-system`, `ui-no-native-multiselect` | `common-accessibility`, `react/*` |
| Performance | `vite-chunk-optimization` | `vite-manual-chunks`, `web-performance-optimization` |

Full inventory: [RULES_INVENTORY.md](./RULES_INVENTORY.md)
