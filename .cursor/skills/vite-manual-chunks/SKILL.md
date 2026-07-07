---
name: vite-manual-chunks
description: Tunes Vite/Rollup bundle chunks via output.manualChunks and chunkSizeWarningLimit without masking bloat. Use when fixing "chunks are larger than 600 kB", adjusting vite.config.ts manualChunks, or splitting vendor libraries — not for runtime perf or Core Web Vitals (web-performance-optimization).
metadata:
  triggers:
    files:
      - vite.config.ts
      - vite.config.*.ts
    keywords:
      - manualChunks
      - chunk size
      - chunkSizeWarningLimit
      - rollup chunk
      - vendor chunk
      - code split
      - bundle split
---

# Vite manualChunks (NiData)

Rollup option: `build.rollupOptions.output.manualChunks`. Official reference: [Rollup output.manualChunks](https://rollupjs.org/configuration-options/#output-manualchunks). NiData details: [reference.md](reference.md).

## Policy (this repo)

1. **Keep** `build.chunkSizeWarningLimit: 600` — do not raise it to hide oversized chunks.
2. **Prefer** route-level `lazy()` + localized `import()` before adding manual chunk rules.
3. **Split vendors** in `vite.config.ts` with the function form (already in use); extend the existing `pkg` map, do not replace with a single `vendor` blob unless diagnosing.
4. **Avoid circular chunks**: shared deps used by multiple vendor chunks need their own chunk (see `vendor-style-utils` for `clsx` / `tailwind-merge` / `cva` vs `vendor-recharts` + `vendor-ui`).
5. **Side effects**: manual chunks can change execution order if modules have side effects on load — test critical flows after splits.

## When to adjust manualChunks vs refactor imports

| Signal | Action |
|--------|--------|
| Warning names one output file (e.g. `vendor-ui-*.js`) | Add or move the heaviest `node_modules` package in that chunk to a new `vendor-*` return value |
| Warning on an app route chunk (e.g. `Dashboard-*.js`) | `lazy()` the route; dynamic `import()` heavy libs inside that route only |
| Many tiny dynamic chunks (locale/strings) | Use `getModuleInfo` graph merge (Rollup advanced example in reference.md) |
| Build OOM / EMFILE on Windows | Tune `maxParallelFileOps` (already `6`); do not disable chunking |

## Workflow

### 1. Identify the offender

- Read the Vite build warning: chunk **file name** and **size (kB)**.
- Optional local analyze: set `VITE_BUNDLE_ANALYZE=true` and rebuild; open the generated stats HTML (plugin: `rollup-plugin-visualizer` in `vite.config.ts`).

### 2. Map module id → chunk name

NiData uses package-level splitting inside `manualChunks(id)`:

```ts
const match = id.match(/node_modules\/((?:@[^/]+\/[^/]+)|[^/]+)/);
const pkg = match?.[1];
// return 'vendor-react' | 'vendor-firebase' | ... per pkg
```

Add a new branch **above** the final implicit fall-through (unassigned `node_modules` stay in Rollup’s default shared chunk).

Named vendor chunks: see [references/chunk-map.md](references/chunk-map.md) — update that table when adding rules.

### 3. Implement safely

```ts
// vite.config.ts — inside build.rollupOptions.output.manualChunks
if (pkg === 'some-heavy-lib') {
  return 'vendor-some-heavy-lib';
}
```

Rules:

- Match **scoped** packages as `@scope/name` (regex already captures this).
- Never put the same package in two return values.
- If two vendor chunks import each other, extract shared deps to a third chunk (pattern: `vendor-style-utils`).

### 4. Verify

- Re-run production build; confirm warning gone or size dropped.
- Smoke-test: first load, dashboard/report routes, PDF export, charts — chunks load in sensible order.
- Record gzip size in `docs/plans/*-baseline.md` when doing dashboard load phases (see bundle row in Phase 1.4b).

## Rollup API

Object form, function form, graph-aware merge: [reference.md](reference.md).

## Anti-patterns

- Raising `chunkSizeWarningLimit` above 600 without splitting code.
- One giant `vendor` chunk for all `node_modules`.
- Splitting `react` and `react-dom` into different manual chunks.
- Duplicating `clsx`/`tailwind-merge` in both `vendor-ui` and `vendor-recharts` (circular chunk risk).
- Suggesting `npm run build` / deploy as the only fix when the user did not ask (they handle builds).

## Related repo guidance

- Rule: `.cursor/rules/general/vite-chunk-optimization.mdc`
- Runtime perf: `.cursor/skills/web-performance-optimization/SKILL.md`
- React route splitting: `.cursor/skills/react/react-performance/SKILL.md`
