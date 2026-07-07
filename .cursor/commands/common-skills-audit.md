---
name: common-skills-audit
description: Audit .cursor/ skills, rules, subagents, and AGENTS.md for redundancy, broken references, and sync drift. Evidence-backed report with consolidation plan.
disable-model-invocation: true
argument-hint: '[optional scope notes or --consolidate to apply fixes]'
---

# Common Skills Audit

**Args:** $ARGUMENTS

## Required

1. Read and follow **`.cursor/skills/common/common-skills-audit/SKILL.md`** exactly.
2. Load all files under `references/` before reporting.
3. Run inventory: `node .cursor/skills/common/cursor-inventory/scripts/inventory.mjs`
4. Output using **`references/output-format.md`** — no alternate format.
5. Apply deletions/merges only if `$ARGUMENTS` contains `--consolidate` or user explicitly asked to fix.

## Escalation

- Single SKILL.md quality → `common/common-skill-creator`
- Application code readiness → `common/vibe-code-auditor`
