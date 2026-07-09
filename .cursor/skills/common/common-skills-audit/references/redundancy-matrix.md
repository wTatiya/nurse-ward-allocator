# Redundancy Matrix — nurse-ward-allocator

> Last verified: **2026-07-09**. Re-run after adding skills, rules, or subagents.

## Project-only skills — never delete via sync

Not overwritten by `ags sync`. If missing after sync, restore from git:

`common/cursor-inventory`, `common/common-skills-audit`, `common/vibe-code-auditor`, `contextual-skill-router`, `vite-manual-chunks`, `web-performance-optimization`, `webapp-testing`

## Rules — known duplicates (delete non-canonical)

| Duplicate | Canonical |
| --- | --- |
| `.cursor/rules/agent-skill-standard-rule.mdc` | `general/agent-skill-standard-rule.mdc` |

## Agents — removed (enterprise / NiData)

| Removed agent | Reason |
| --- | --- |
| `specialist-jira-analyst`, `specialist-confluence-searcher` | No Jira/Confluence workflow |
| `specialist-zephyr-scanner`, `specialist-tc-creator` | No Zephyr test management |
| `specialist-mobile-reverser`, `specialist-logic-hacker`, `specialist-aspm-correlator` | Mobile/red-team/ASPM not in scope |
| `specialist-pr-commenter-batch`, `specialist-ac-verifier` | Enterprise PR/ticket pipeline |
| `specialist-test-gap-finder` | Merged into `senior-qa` diff review mode |

## Skills — excluded via `.skillsrc` (not in repo)

| Skill | Reason |
| --- | --- |
| `common-dast-tooling`, `common-pentest-methodology`, `common-exploit-verification` | Heavy pentest; use `common-owasp` + `security-reviewer` |
| `common-store-changelog` | No app store releases |
| `common-llm-security` | No LLM features in app |
| `common-mobile-*` | Web SPA only |

## Skills — cluster canonical (do not duplicate)

| Domain | Canonical | Adjacent (keep — different job) |
| --- | --- | --- |
| Code review | `common/common-code-review` | `vibe-code-auditor` (prototype readiness) |
| Security scan | `common/common-security-audit` | `common/common-owasp` (checklist) |
| Architecture | `common/common-architecture-audit` | `common/common-system-design` |
| Meta inventory | `common/cursor-inventory` | `common/common-skills-audit` |
| Testing | `common/common-tdd` | `react/react-testing`, `webapp-testing` |
| Performance | `web-performance-optimization` | `react/react-performance`, `vite-manual-chunks` |

## Intentional overlap (keep both)

- `web-performance-optimization` vs `react/react-performance` — site-wide vs React-specific.
- `common/common-debugging` vs `root-cause-investigator` — skill protocol vs subagent execution.
- `react/react-testing` vs `webapp-testing` — unit/component vs Playwright E2E.
