---
name: common-skills-audit
description: Audits .cursor/ skills, rules, subagents, and AGENTS.md for redundancy, broken references, sync drift, and routing gaps. Use when consolidating agent config, after adding skills/rules/subagents, or when user requests /common-skills-audit or skills inventory cleanup.
disable-model-invocation: true
---

# Common Skills Audit

## **Priority: P1**

Audit the agent configuration layer (not application code). Produce evidence-backed findings and a consolidation plan.

## Scope

| Path | Check |
| --- | --- |
| `.cursor/skills/**/SKILL.md` | Duplicates, orphan refs, missing `_INDEX.md` entries |
| `.cursor/rules/**/*.mdc` | Duplicate always-on rules, deprecated paths still referenced |
| `.cursor/agents/*.{md,mdc}` | Overlapping personas, enterprise-only agents, broken skill links |
| `.cursor/commands/*.md` | Slash commands pointing to missing skills or NiData-only integrations |
| `AGENTS.md`, `.skillsrc` | Stale counts, missing project-only skills, wrong sync scope |
| `.cursor/agents/contextual-orchestrator.md` | Registry drift vs disk |

## Workflow

1. **Inventory** — run `node .cursor/skills/common/cursor-inventory/scripts/inventory.mjs --out .cursor/skills/common/cursor-inventory/INVENTORY.md`.
2. **Load canonical docs** — `AGENTS.md`, `.skillsrc`, `.cursor/skills/README.md`, `.cursor/rules/RULES_INVENTORY.md`, `contextual-orchestrator.md`.
3. **Detect redundancy** — same body in two rule paths; skill cluster overlap (see [references/redundancy-matrix.md](references/redundancy-matrix.md)).
4. **Detect broken links** — commands → skills, rules → skills, agents → skills, deprecated IDs in docs.
5. **Sync check** — project-only skills listed in README must not be in `ags sync` overwrite set; registry excludes must match intent.
6. **Report** — use [references/output-format.md](references/output-format.md). Apply deletions only when user requests consolidation.
7. **Post-consolidation verify** — re-run inventory; confirm counts match orchestrator + AGENTS.md (**46 skills**, **3 commands**, **18 subagents**, **20 rules**).
8. **Post-sync drift** — if `ags sync` truncated `_INDEX.md` or deleted project-only meta skills, restore from git before reporting clean.

## Recovery note

If project-only meta skills (`common-skills-audit`, `cursor-inventory`, `vibe-code-auditor`) are missing after `ags sync`, restore from git or copy from a backup — they are **not** in the registry.

Restore `_INDEX.md` keyword rows for meta skills if missing (see checklist).

## Consolidation rules (when user requests cleanup)

| Pattern | Action |
| --- | --- |
| Duplicate rule at root + `general/` | Keep `general/`; delete root duplicate |
| Agent merged into mode (e.g. test gaps → `senior-qa`) | Delete specialist file; update orchestrator + AGENTS |
| Enterprise-only agent (Jira, Zephyr, mobile reverser, logic hacker, ASPM) | Delete file; document in RULES_INVENTORY / orchestrator removed list |
| Skill not relevant to web + Supabase stack | Add to `.skillsrc` exclude; delete from disk |
| Orphan slash command (NiData TickTick) | Remove or repoint command |

## Escalation

- Single skill quality → `common/common-skill-creator`
- Application production readiness → `common/vibe-code-auditor`
- Security of agent config (secrets in skills) → `common/common-security-audit`

## Anti-patterns

- No deleting `ags sync` managed skills without updating `.skillsrc` excludes.
- No merging distinct specialist subagents with different tool budgets.
- No audit without running inventory script when Node available.

## References

- [Output format](references/output-format.md)
- [Redundancy matrix](references/redundancy-matrix.md)
- [Checklist](references/checklist.md)
