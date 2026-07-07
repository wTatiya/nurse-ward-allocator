# Web Performance Optimization – Reference

This file contains deeper checklists and “what to try next” guidance. Keep `SKILL.md` short and use this as the expandable playbook.

---

## Measurement checklist (baseline quality)

- **Use consistent conditions**: same URL, same build, same cache state, same throttling, same device profile.
- **Run multiple times**: performance is noisy; take median (or at least compare like-for-like runs).
- **Separate lab vs field**:
  - **Lab**: Lighthouse, DevTools, WebPageTest.
  - **Field**: RUM/Core Web Vitals from real users (preferred for “did it get better?”).

### Tools

- **Lighthouse** (Chrome DevTools or CLI)
- **Chrome DevTools**:
  - **Network**: waterfall, caching, compression, request count, priorities
  - **Performance**: long tasks, main-thread breakdown, layout/paint
  - **Coverage**: unused JS/CSS
- **WebPageTest**: repeatable waterfall + filmstrip + CPU/network shaping
- **Bundle analyzers**: webpack bundle analyzer / source-map-explorer / Vite visualizer

---

## Core Web Vitals playbook

### LCP (Largest Contentful Paint)

Most common causes:
- LCP element is a **large image** delivered too late or too large
- Render-blocking **CSS/JS**
- High **TTFB**

Fixes to try (in order):
- **Make the LCP resource smaller**:
  - Convert to AVIF/WebP; compress aggressively
  - Serve responsive sizes (`srcset`, `sizes`)
- **Ensure LCP is not delayed**:
  - Do **not** lazy-load the LCP image
  - Use `fetchpriority="high"` for LCP images where appropriate
  - Preload critical image/font sparingly (avoid preloading everything)
- **Reduce render blocking**:
  - Inline critical CSS; defer non-critical CSS
  - Defer non-critical scripts (`defer`/`async`) and reduce early JS work
- **Reduce TTFB**:
  - CDN caching, server caching, faster origin, SSG/ISR where applicable

### INP (Interaction to Next Paint)

Most common causes:
- Long JS tasks (>50ms) blocking input
- Heavy hydration/initialization
- Expensive re-renders (large lists/tables/charts)

Fixes to try:
- Break long tasks into chunks; schedule work after first paint / after load
- Move heavy computation off main thread (Web Worker)
- Virtualize large lists/tables; debounce expensive handlers
- Reduce hydration cost (less JS, fewer client-only components)
- Remove heavy dependencies; reduce bundle size

### CLS (Cumulative Layout Shift)

Most common causes:
- Images/iframes/ads without reserved space
- Late-inserting banners above content
- Font swaps that change layout

Fixes to try:
- Always reserve space: `width`/`height` and/or `aspect-ratio`
- Avoid inserting UI above existing content; reserve slots
- Use `font-display: swap` and choose fallback fonts with similar metrics

---

## Bundle size & JS delivery

### Diagnosis

- Identify largest chunks and why they load early.
- Look for:
  - heavy date libraries
  - full-library imports (e.g., `lodash` entire package)
  - duplicated dependencies across bundles
  - large polyfills

### Fixes

- Code split by route and by feature (admin/tools/reporting)
- Lazy load:
  - charts, editors, PDF viewers, maps, chat widgets
- Prefer selective imports / smaller replacements
- Ensure tree-shaking works:
  - ESM builds
  - named exports
  - avoid patterns that defeat tree-shaking

---

## Images, media, and fonts

### Images

- Convert to AVIF/WebP (keep JPEG/PNG fallback if needed)
- Use responsive `srcset` and `sizes`
- Specify dimensions to prevent CLS
- Use `loading="lazy"` for below-the-fold images, not for the LCP image
- Serve from a CDN; enable long-lived caching for hashed assets

### Fonts

- Prefer `woff2`
- Use `font-display: swap`
- Subset fonts if they are large
- Preload only the truly critical font files

---

## Caching and compression (quick rules)

- Static assets with content hashes:
  - `Cache-Control: public, max-age=31536000, immutable`
- HTML/documents:
  - short max-age + revalidation (varies by architecture)
- Enable Brotli or gzip for text assets (HTML/CSS/JS/JSON/SVG)
- Prefer CDN edge caching for public content; avoid caching personalized responses

---

## “What should I do next?” decision guide

- **LCP is bad** → start with hero image + TTFB + render-blocking resources
- **INP is bad** → profile long tasks, reduce early JS, virtualize, defer non-critical work
- **CLS is bad** → reserve space for media/ads, stabilize layout, font swap strategy
- **Overall score is low** → reduce request count, compress assets, caching headers, bundle splitting
