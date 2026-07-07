---
name: cursor-inventory
description: List all Cursor skills, slash commands, and subagents under .cursor/ as markdown tables with IDs and brief descriptions.
disable-model-invocation: true
argument-hint: '[optional --out path/to/file.md]'
---

# Cursor Inventory

**Args:** $ARGUMENTS

## Required

1. Read and follow **`.cursor/skills/common/cursor-inventory/SKILL.md`**.
2. Run from repo root:

```bash
python .cursor/skills/common/cursor-inventory/scripts/inventory.py
# or: node .cursor/skills/common/cursor-inventory/scripts/inventory.mjs
```

If `$ARGUMENTS` contains `--out <path>`, pass it through to the script.

3. Return the script output verbatim (three markdown tables + summary).
4. Do not edit skills or agents unless the user explicitly asks.
