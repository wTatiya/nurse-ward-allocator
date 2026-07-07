#!/usr/bin/env python3
"""Scan .cursor/ for skills, slash commands, and subagents; emit markdown tables."""

from __future__ import annotations

import argparse
import re
import sys
from datetime import date
from pathlib import Path


FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---", re.DOTALL)
FIELD_RE = re.compile(r"^(\w[\w-]*):\s*(.+)$", re.MULTILINE)
SKILL_LINK_RE = re.compile(
    r"\.cursor/skills/[^`\s]+/SKILL\.md", re.IGNORECASE
)


def repo_root_from_script() -> Path:
    # scripts/ -> cursor-inventory/ -> common/ -> skills/ -> .cursor/ -> repo
    return Path(__file__).resolve().parents[5]


def parse_frontmatter(text: str) -> dict[str, str]:
    match = FRONTMATTER_RE.match(text)
    if not match:
        return {}
    block = match.group(1)
    fields: dict[str, str] = {}
    for key, raw in FIELD_RE.findall(block):
        value = raw.strip()
        if (value.startswith('"') and value.endswith('"')) or (
            value.startswith("'") and value.endswith("'")
        ):
            value = value[1:-1]
        fields[key] = value
    return fields


def truncate(text: str, limit: int = 200) -> str:
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "…"


def fallback_description(text: str) -> str:
    body = FRONTMATTER_RE.sub("", text, count=1).strip()
    for line in body.splitlines():
        line = line.strip()
        if line.startswith("#"):
            return truncate(line.lstrip("#").strip())
        if line:
            return truncate(line)
    return "(no description)"


def normalize_rel(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def resolve_subagent_id(path: Path) -> str:
    stem = path.stem
    if stem.startswith("specialist-"):
        return stem[len("specialist-") :]
    return stem


def find_skill_link(text: str) -> str:
    match = SKILL_LINK_RE.search(text)
    if not match:
        return "-"
    skill_path = match.group(0)
    # extract folder name before SKILL.md as hint; full parse would need file read
    parts = skill_path.replace("\\", "/").split("/")
    if "SKILL.md" in parts:
        idx = parts.index("SKILL.md")
        if idx >= 1:
            return parts[idx - 1]
    return "-"


def collect_skills(cursor_dir: Path, root: Path) -> list[dict[str, str]]:
    rows: dict[str, dict[str, str]] = {}
    for skill_file in sorted(cursor_dir.glob("skills/**/SKILL.md")):
        text = skill_file.read_text(encoding="utf-8", errors="replace")
        meta = parse_frontmatter(text)
        skill_id = meta.get("name") or skill_file.parent.name
        rel = normalize_rel(skill_file, root)
        desc = meta.get("description") or fallback_description(text)
        rows[skill_id] = {
            "id": f"/{skill_id}",
            "path": normalize_rel(skill_file, root),
            "description": truncate(desc),
        }
    return sorted(rows.values(), key=lambda r: r["id"].lower())


def collect_commands(cursor_dir: Path, root: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    commands_dir = cursor_dir / "commands"
    if not commands_dir.is_dir():
        return rows
    for cmd_file in sorted(commands_dir.glob("*.md")):
        text = cmd_file.read_text(encoding="utf-8", errors="replace")
        meta = parse_frontmatter(text)
        cmd_id = meta.get("name") or cmd_file.stem
        rel = normalize_rel(cmd_file, root)
        desc = meta.get("description") or fallback_description(text)
        rows.append(
            {
                "id": f"/{cmd_id}",
                "path": normalize_rel(cmd_file, root),
                "description": truncate(desc),
                "linked": find_skill_link(text),
            }
        )
    return sorted(rows, key=lambda r: r["id"].lower())


def collect_subagents(cursor_dir: Path, root: Path) -> list[dict[str, str]]:
    seen_paths: set[str] = set()
    rows: dict[str, dict[str, str]] = {}
    agents_dir = cursor_dir / "agents"
    patterns = ("*.md", "*.mdc")
    files: list[Path] = []
    for pattern in patterns:
        files.extend(agents_dir.glob(pattern))
    for agent_file in sorted(files, key=lambda p: p.as_posix().lower()):
        rel = normalize_rel(agent_file, root)
        rel_key = rel.lower()
        if rel_key in seen_paths:
            continue
        seen_paths.add(rel_key)

        text = agent_file.read_text(encoding="utf-8", errors="replace")
        meta = parse_frontmatter(text)
        agent_id = meta.get("name") or resolve_subagent_id(agent_file)
        desc = meta.get("description") or fallback_description(text)
        rows[agent_id] = {
            "id": agent_id,
            "path": normalize_rel(agent_file, root),
            "description": truncate(desc),
            "invoke": "Task `subagent_type`",
        }
    return sorted(rows.values(), key=lambda r: r["id"].lower())


def render_table(headers: list[str], rows: list[list[str]]) -> str:
    if not rows:
        return "_None found._\n"
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    for row in rows:
        escaped = [c.replace("|", "\\|") for c in row]
        lines.append("| " + " | ".join(escaped) + " |")
    return "\n".join(lines) + "\n"


def build_markdown(root: Path) -> str:
    cursor_dir = root / ".cursor"
    skills = collect_skills(cursor_dir, root)
    commands = collect_commands(cursor_dir, root)
    subagents = collect_subagents(cursor_dir, root)

    parts = [
        "# Cursor skills and subagents inventory",
        "",
        f"> Generated {date.today().isoformat()} from `.cursor/`",
        "",
        "## Skills",
        "",
        render_table(
            ["ID", "Path", "Description"],
            [[r["id"], r["path"], r["description"]] for r in skills],
        ),
        "## Slash commands",
        "",
        render_table(
            ["ID", "Path", "Description", "Linked skill"],
            [
                [r["id"], r["path"], r["description"], r["linked"]]
                for r in commands
            ],
        ),
        "## Subagents",
        "",
        render_table(
            ["ID", "Path", "Description", "Invoke via"],
            [
                [r["id"], r["path"], r["description"], r["invoke"]]
                for r in subagents
            ],
        ),
        "## Summary",
        "",
        f"- **Skills:** {len(skills)}",
        f"- **Slash commands:** {len(commands)}",
        f"- **Subagents:** {len(subagents)}",
        f"- **Scope:** `.cursor/skills/`, `.cursor/commands/`, `.cursor/agents/`",
        "",
    ]
    return "\n".join(parts)


def main() -> int:
    parser = argparse.ArgumentParser(description="Emit .cursor inventory tables")
    parser.add_argument(
        "--root",
        type=Path,
        default=None,
        help="Repository root (default: inferred from script location)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Write markdown to this file instead of stdout",
    )
    args = parser.parse_args()
    root = (args.root or repo_root_from_script()).resolve()
    if not (root / ".cursor").is_dir():
        print(f"error: no .cursor at {root}", file=sys.stderr)
        return 1
    md = build_markdown(root)
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(md, encoding="utf-8")
        print(f"Wrote {args.out}", file=sys.stderr)
    else:
        print(md, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
