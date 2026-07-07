# Rollup manualChunks reference (NiData)

Source: [Rollup Configuration Options — output.manualChunks](https://rollupjs.org/configuration-options/#output-manualchunks)

## Type

```ts
type ManualChunks =
  | { [chunkAlias: string]: string[] }
  | ((
      id: string,
      api: { getModuleInfo: GetModuleInfo; getModuleIds: GetModuleIds }
    ) => string | void);
```

Vite path: `build.rollupOptions.output.manualChunks`.

## Object form

Each key is the output chunk name; values are module specifiers (need not be in the graph if using deep imports with `@rollup/plugin-node-resolve`):

```ts
manualChunks: {
  lodash: ['lodash'],
}
```

All `lodash/*` imports merge into chunk `lodash`.

## Function form (basic)

```ts
function manualChunks(id: string) {
  if (id.includes('node_modules')) {
    return 'vendor';
  }
}
```

Each resolved module `id` is tested once. Return value = chunk alias. Dependencies follow into that chunk unless already assigned elsewhere.

## Function form (module graph)

Use when many small dynamic imports should merge (e.g. per-language string files):

```ts
function manualChunks(id, { getModuleInfo }) {
  const match = /.*\.strings\.(\w+)\.js/.exec(id);
  if (!match) return;

  const language = match[1];
  const dependentEntryPoints: string[] = [];
  const idsToHandle = new Set(getModuleInfo(id)?.dynamicImporters ?? []);

  for (const moduleId of idsToHandle) {
    const info = getModuleInfo(moduleId);
    if (!info) continue;
    const { isEntry, dynamicImporters, importers } = info;
    if (isEntry || dynamicImporters.length > 0) {
      dependentEntryPoints.push(moduleId);
    }
    for (const importerId of importers) idsToHandle.add(importerId);
  }

  if (dependentEntryPoints.length === 1) {
    const entry = dependentEntryPoints[0].split('/').slice(-1)[0].split('.')[0];
    return `${entry}.strings.${language}`;
  }
  if (dependentEntryPoints.length > 1) {
    return `shared.strings.${language}`;
  }
}
```

## Side effects warning

Manual chunks can run module side effects earlier than without splitting. After changing chunks, verify auth bootstrap, Firebase init, and global CSS registration.

## onlyExplicitManualChunks

When `true`, only listed modules enter the manual chunk (stricter; Rollup 5 default direction). NiData currently relies on dependency merging — revisit when upgrading Rollup major versions.

## NiData vite.config.ts anchor

File: `vite.config.ts` — `chunkSizeWarningLimit: 600`, `reportCompressedSize: false`, `maxParallelFileOps: 6`, `manualChunks` vendor map. Bundle analyze: `VITE_BUNDLE_ANALYZE=true`.
