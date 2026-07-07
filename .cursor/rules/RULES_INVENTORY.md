# Cursor rules inventory

Canonical editor rules in `.cursor/rules/**/*.mdc`. Consolidated **2026-07-07**.

| File | alwaysApply | globs (summary) |
| --- | --- | --- |
| `general/active-tab-first.mdc` | yes | — |
| `general/agent-skill-standard-rule.mdc` | yes | `**/*` |
| `general/browser-tag-mandatory.mdc` | yes | — |
| `general/communication-and-beginner-safety.mdc` | yes | — |
| `general/context-auto-research.mdc` | yes | — |
| `general/debugging-protocol-pointer.mdc` | yes | — |
| `general/no-browser-cache-suggestions.mdc` | yes | — |
| `general/orchestrator-subagent.mdc` | yes | `*` |
| `general/repo-context-map.mdc` | yes | — |
| `general/repo-coding-debugging.mdc` | yes | — |
| `general/security-routing.mdc` | yes | — |
| `general/ultra-think.mdc` | yes | — |
| `general/web-console-raw-export.mdc` | yes | — |
| `general/writing-plans.mdc` | yes | — |
| `general/stop-slop.mdc` | no | `**/*.md`, `**/*.mdx`, `**/*.txt`, `**/*.json` |
| `general/ui-design-system.mdc` | no | `src/**/*.{js,jsx,ts,tsx}` |
| `general/vite-chunk-optimization.mdc` | no | `vite.config.ts`, routes |
| `general/ui-no-native-multiselect.mdc` | no | `src/**/*.{ts,tsx,js,jsx}` |
| `general/ui-no-tmi-disclaimers.mdc` | no | `src/**/*.{tsx,jsx}` |
| `project/supabase-editing.mdc` | no | `supabase/**/*` |

## Removed during consolidation

| Path | Reason |
| --- | --- |
| `.cursor/rules/agent-skill-standard-rule.mdc` | Duplicate of `general/` |
| `general/quarterly-work-log.mdc` | Manager work logs — not project scope |
| NiData `nidata/*`, Firestore rules | Wrong stack / domain |

Skills index: `AGENTS.md`. Skill bodies: `.cursor/skills/**/SKILL.md`.
