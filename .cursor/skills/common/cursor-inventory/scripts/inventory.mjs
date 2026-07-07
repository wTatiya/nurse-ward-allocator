#!/usr/bin/env node
/** Scan .cursor/ for skills, slash commands, and subagents; emit markdown tables. */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, relative, resolve, dirname, sep } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..", "..", "..", "..");

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---/;
const FIELD_RE = /^([\w-]+):\s*(.+)$/gm;
const SKILL_LINK_RE = /\.cursor\/skills\/[^`\s]+\/SKILL\.md/gi;

function parseFrontmatter(text) {
  const match = text.match(FRONTMATTER_RE);
  if (!match) return {};
  const fields = {};
  let m;
  const block = match[1];
  FIELD_RE.lastIndex = 0;
  while ((m = FIELD_RE.exec(block)) !== null) {
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    fields[m[1]] = value;
  }
  return fields;
}

function truncate(text, limit = 200) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= limit ? flat : flat.slice(0, limit - 1).trimEnd() + "…";
}

function fallbackDescription(text) {
  const body = text.replace(FRONTMATTER_RE, "").trim();
  for (const line of body.split("\n")) {
    const t = line.trim();
    if (t.startsWith("#")) return truncate(t.replace(/^#+\s*/, ""));
    if (t) return truncate(t);
  }
  return "(no description)";
}

function walk(dir, suffix, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, suffix, out);
    else if (name === suffix || full.endsWith(suffix)) out.push(full);
  }
  return out;
}

function toPosix(p) {
  return p.split(sep).join("/");
}

function resolveSubagentId(filePath) {
  const stem = filePath.replace(/\.(md|mdc)$/, "").split(/[/\\]/).pop();
  return stem.startsWith("specialist-") ? stem.slice("specialist-".length) : stem;
}

function findSkillLink(text) {
  const match = text.match(SKILL_LINK_RE);
  if (!match) return "-";
  const parts = match[0].split("/");
  const idx = parts.indexOf("SKILL.md");
  return idx >= 1 ? parts[idx - 1] : "-";
}

function relCursorPath(absPath) {
  return toPosix(relative(repoRoot, absPath));
}

function collectSkills(cursorDir) {
  const rows = new Map();
  const skillDir = join(cursorDir, "skills");
  for (const file of walk(skillDir, "SKILL.md")) {
    const text = readFileSync(file, "utf8");
    const meta = parseFrontmatter(text);
    const id = meta.name || file.split(sep).slice(-2, -1)[0];
    rows.set(id, {
      id: `/${id}`,
      path: relCursorPath(file),
      description: truncate(meta.description || fallbackDescription(text)),
    });
  }
  return [...rows.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function collectCommands(cursorDir) {
  const cmdDir = join(cursorDir, "commands");
  let files = [];
  try {
    files = readdirSync(cmdDir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => join(cmdDir, f));
  } catch {
    return [];
  }
  return files
    .map((file) => {
      const text = readFileSync(file, "utf8");
      const meta = parseFrontmatter(text);
      const stem = file.split(sep).pop().replace(/\.md$/, "");
      return {
        id: `/${meta.name || stem}`,
        path: relCursorPath(file),
        description: truncate(meta.description || fallbackDescription(text)),
        linked: findSkillLink(text),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

function collectSubagents(cursorDir) {
  const agentsDir = join(cursorDir, "agents");
  const seen = new Set();
  const rows = new Map();
  for (const name of readdirSync(agentsDir)) {
    if (!name.endsWith(".md") && !name.endsWith(".mdc")) continue;
    const file = join(agentsDir, name);
    const key = toPosix(relative(repoRoot, file)).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const text = readFileSync(file, "utf8");
    const meta = parseFrontmatter(text);
    const id = meta.name || resolveSubagentId(name);
    rows.set(id, {
      id,
      path: relCursorPath(file),
      description: truncate(meta.description || fallbackDescription(text)),
      invoke: "Task `subagent_type`",
    });
  }
  return [...rows.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function renderTable(headers, rows) {
  if (!rows.length) return "_None found._\n";
  const lines = [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((c) => String(c).replace(/\|/g, "\\|")).join(" | ")} |`),
  ];
  return lines.join("\n") + "\n";
}

function buildMarkdown() {
  const cursorDir = join(repoRoot, ".cursor");
  const skills = collectSkills(cursorDir);
  const commands = collectCommands(cursorDir);
  const subagents = collectSubagents(cursorDir);
  const today = new Date().toISOString().slice(0, 10);

  return [
    "# Cursor skills and subagents inventory",
    "",
    `> Generated ${today} from \`.cursor/\``,
    "",
    "## Skills",
    "",
    renderTable(
      ["ID", "Path", "Description"],
      skills.map((r) => [r.id, r.path, r.description])
    ),
    "## Slash commands",
    "",
    renderTable(
      ["ID", "Path", "Description", "Linked skill"],
      commands.map((r) => [r.id, r.path, r.description, r.linked])
    ),
    "## Subagents",
    "",
    renderTable(
      ["ID", "Path", "Description", "Invoke via"],
      subagents.map((r) => [r.id, r.path, r.description, r.invoke])
    ),
    "## Summary",
    "",
    `- **Skills:** ${skills.length}`,
    `- **Slash commands:** ${commands.length}`,
    `- **Subagents:** ${subagents.length}`,
    "- **Scope:** `.cursor/skills/`, `.cursor/commands/`, `.cursor/agents/`",
    "",
  ].join("\n");
}

const outIdx = process.argv.indexOf("--out");
const outPath = outIdx >= 0 ? process.argv[outIdx + 1] : null;
const md = buildMarkdown();

if (outPath) {
  mkdirSync(resolve(outPath, ".."), { recursive: true });
  writeFileSync(outPath, md, "utf8");
  console.error(`Wrote ${outPath}`);
} else {
  process.stdout.write(md);
}
