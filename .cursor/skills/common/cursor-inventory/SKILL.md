---
name: cursor-inventory
description: Scans the entire .cursor directory and outputs markdown tables of skills, slash commands, and subagents with IDs and brief descriptions. Use when the user asks for a skills catalog, subagent list, slash command reference, or /cursor-inventory.
disable-model-invocation: true
---

# Cursor Inventory

Catalog every skill and subagent under `.cursor/` as markdown tables.

## Quick start

From repo root (Python or Node):

```bash
python .cursor/skills/common/cursor-inventory/scripts/inventory.py
# Windows without Python:
node .cursor/skills/common/cursor-inventory/scripts/inventory.mjs
```

Optional output file:

```bash
python .cursor/skills/common/cursor-inventory/scripts/inventory.py --out docs/cursor-inventory.md
```

## When invoked manually (no script)

1. Scan `.cursor/skills/**/SKILL.md` — parse YAML frontmatter `name` and `description`.
2. Scan `.cursor/commands/*.md` — parse `name` and `description` (slash commands).
3. Scan `.cursor/agents/*.{md,mdc}` — parse frontmatter; dedupe by resolved ID.
4. Run the script when possible (preferred — consistent IDs and deduping).

## ID rules

| Kind | ID column | Resolution |
| --- | --- | --- |
| Skill | `/name` | Frontmatter `name`, else parent folder name |
| Slash command | `/name` | Frontmatter `name`, else filename stem |
| Subagent | `subagent_type` | Frontmatter `name`; else `specialist-*.mdc` → strip `specialist-` prefix; else filename stem |

Subagents are invoked via the Task tool (`subagent_type`), not always as slash commands. Note that in the table when no matching `.cursor/commands/` entry exists.

## Output format

Return exactly three tables in this order:

### Skills

| ID | Path | Description |
| --- | --- | --- |
| `/common-debugging` | `.cursor/skills/common/common-debugging/SKILL.md` | … |

Sort by ID ascending. One row per unique skill `name`.

### Slash commands

| ID | Path | Description | Linked skill |
| --- | --- | --- | --- |
| `/vibe-code-auditor` | `.cursor/commands/vibe-code-auditor.md` | … | `vibe-code-auditor` |

Sort by ID ascending.

### Subagents

| ID | Path | Description | Invoke via |
| --- | --- | --- | --- |
| `frontend-developer` | `.cursor/agents/frontend-developer.md` | … | Task `subagent_type` |

Sort by ID ascending. Deduplicate paths (ignore Windows duplicate casing).

## Footer

After the tables, include:

- **Generated:** ISO date
- **Counts:** skills, slash commands, subagents
- **Scope:** `.cursor/skills/`, `.cursor/agents/`, `.cursor/commands/` only (not rules, plans, or hooks)

## Additional resources

- Output template details: [references/output-format.md](references/output-format.md)
