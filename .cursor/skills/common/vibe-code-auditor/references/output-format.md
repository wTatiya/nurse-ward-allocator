# Vibe Code Auditor — Output Format

```markdown
# Vibe Code Audit Report

**Scope:** {files/dirs}
**Stack:** {detected stack}
**Date:** {ISO date}
**Score:** {0–100}/100 — {Ship | Fix first | Not production-ready}

## Executive summary

{2–4 sentences: biggest risks and overall readiness}

## Dimension scores

| Dimension | Score | Weight | Notes |
| --- | --- | --- | --- |
| Security | /100 | 30% | … |
| Architecture | /100 | 25% | … |
| Robustness | /100 | 25% | … |
| Maintainability | /100 | 20% | … |

## Critical findings (P0)

| ID | File:line | Issue | Evidence | Fix direction |
| --- | --- | --- | --- | --- |

## Major findings (P1)

| ID | File:line | Issue | Evidence | Fix direction |
| --- | --- | --- | --- | --- |

## Minor / hardening (P2)

- …

## What looks good

- …

## Recommended next steps

1. …
2. …

## Escalation suggested

- [ ] `common/common-security-audit` — {reason}
- [ ] `common/common-architecture-audit` — {reason}
```

Every P0/P1 row must include **Evidence** (grep, snippet, or behavior trace). Empty evidence → downgrade severity.
