# Common Skills Audit Checklist

## Pre-flight

- [ ] Read `AGENTS.md` SKILLS_INDEX and SUBAGENTS_INDEX blocks
- [ ] Run `node .cursor/skills/common/cursor-inventory/scripts/inventory.mjs --out .cursor/skills/common/cursor-inventory/INVENTORY.md`
- [ ] Read `.skillsrc` and `.cursor/skills/README.md` project-only list

## Skills

- [ ] Every `.cursor/commands/*.md` linked skill exists on disk
- [ ] Project-only skills documented and not overwritten by sync
- [ ] No duplicate skill `name` in frontmatter
- [ ] `_INDEX.md` keyword entries for meta skills (`cursor-inventory`, `common-skills-audit`, `vibe-code-auditor`)

## Rules

- [ ] No duplicate `alwaysApply: true` rule bodies at root vs `general/`
- [ ] RULES_INVENTORY.md matches disk
- [ ] No NiData-only rule references in commands

## Subagents

- [ ] Count matches orchestrator claim (18 = 12 `*.md` + 6 `specialist-*.mdc`)
- [ ] No enterprise-only specialists on disk
- [ ] AGENTS.md subagent table matches Task `subagent_type` IDs

## Docs sync

- [ ] `contextual-orchestrator.md` agent table current
- [ ] `contextual-skill-router/SKILL.md` escalation map current
- [ ] Consolidation date bumped when changes land

## Post-flight

- [ ] Inventory regenerated
- [ ] Deprecated paths removed
- [ ] AGENTS.md / orchestrator / RULES_INVENTORY updated
- [ ] Post-sync: project-only meta skills restored if missing
- [ ] Post-sync: duplicate root `agent-skill-standard-rule.mdc` deleted
- [ ] Post-sync: enterprise specialists deleted if reappeared
