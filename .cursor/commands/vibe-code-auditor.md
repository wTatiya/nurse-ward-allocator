---
name: vibe-code-auditor
description: Audit AI-generated, prototype, or vibe-coded software for production readiness — security, architecture, robustness, and technical debt. Evidence-backed report with score.
disable-model-invocation: true
argument-hint: '[path, file, or scope notes]'
---

# Vibe Code Auditor

**Scope:** $ARGUMENTS

If `$ARGUMENTS` is empty, audit code from (in order):
1. Files the user attached or @-mentioned in this message
2. Currently open / active editor tabs
3. Recent git diff (`git diff` + untracked files in scope) when user implies "my changes"

If no code is available, ask once for: file(s), directory, or paste — then stop.

## Required

1. Read and follow **`.cursor/skills/common/vibe-code-auditor/SKILL.md`** exactly.
2. Load all linked files under `references/` before reporting.
3. Output the audit using **`references/output-format.md`** — no alternate format.
4. Do not rewrite code unless the user explicitly asks to fix findings.

## Escalation (only when findings warrant)

- Deep security → `common/common-security-audit`
- Architecture debt → `common/common-architecture-audit`
- PR/diff review → `common/common-code-review`
