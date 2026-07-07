# Cursor inventory output format

## Description column

Use the frontmatter `description` verbatim when present. If missing:

- **Skills:** first H1 heading after frontmatter, trimmed to one sentence.
- **Subagents:** first sentence of the persona/mission section.
- **Commands:** first paragraph after frontmatter.

Truncate descriptions longer than 200 characters with `…`.

## Linked skill (commands only)

If the command body references `.cursor/skills/**/SKILL.md`, list the skill `name` from that file. Otherwise `-`.

## Invoke via (subagents)

| Value | Meaning |
| --- | --- |
| `Task subagent_type` | Default — delegate via Task tool |
| `Task subagent_type` + `/command` | Also has a `.cursor/commands/` entry |

Built-in Cursor subagent `explore` is not under `.cursor/agents/` — add a footnote row only if the user asks for built-ins.

## Exclusions

Do not list:

- `references/`, `scripts/`, `_INDEX.md`, `README.md`
- `.cursor/rules/`, `.cursor/plans/`, `.cursor/hooks/`
- Duplicate Windows path variants (same normalized path)
