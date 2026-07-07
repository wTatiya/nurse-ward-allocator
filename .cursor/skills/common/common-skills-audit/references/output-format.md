# Common Skills Audit — Output Format

Return exactly this structure:

```markdown
# Agent Config Audit Report

**Scope:** {paths audited}
**Date:** {ISO date}
**Score:** {0–100} — {Ready | Needs cleanup | High drift}

## Summary

| Metric | Count |
| --- | --- |
| Skills | N |
| Slash commands | N |
| Subagents | N |
| Rules (.mdc) | N |

## Findings

### Critical (fix before next session)

| ID | Location | Issue | Recommended action |
| --- | --- | --- | --- |
| C1 | … | … | … |

### Major (consolidate soon)

| ID | Location | Issue | Recommended action |
| --- | --- | --- | --- |

### Minor / suggestions

- …

## Redundancy map

| Item A | Item B | Relationship | Keep |
| --- | --- | --- | --- |

## Broken references

| Source | Target | Fix |
| --- | --- | --- |

## Sync & registry

- `.skillsrc` NiData-only list: {ok | gaps}
- AGENTS.md vs disk: {ok | stale sections}
- Orchestrator registry vs disk: {ok | stale}

## Consolidation plan (if requested)

1. …
2. …

## Verification checklist

- [ ] Inventory regenerated
- [ ] Deprecated paths removed
- [ ] AGENTS.md / orchestrator / RULES_INVENTORY updated
```

Severity: **Critical** = broken invoke path or duplicate always-on rule; **Major** = deprecated agent still on disk or cluster overlap causing wrong routing; **Minor** = doc drift, wording duplication.
