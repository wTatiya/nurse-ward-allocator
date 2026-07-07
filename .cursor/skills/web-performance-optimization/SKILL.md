---
name: web-performance-optimization
description: Systematically measures and improves web performance (Core Web Vitals, Lighthouse, runtime, network, bundle size, caching). Use when a site loads slowly, optimizing LCP/INP/CLS, or debugging runtime bottlenecks — not for vite.config manualChunks (vite-manual-chunks) or React render waterfalls (react-performance).
---

# Web Performance Optimization

Help developers improve user-perceived performance, Core Web Vitals, SEO, and conversions with an evidence-first workflow.

## Quick start (workflow)

1. **Measure baseline**
   - Capture **Lighthouse** (mobile + desktop) and key metrics (**LCP**, **INP** \(replaced FID\), **CLS**, **TTFB**, **TBT**).
   - Record **test conditions** (device, throttling, URL, build, cache state) so before/after comparisons are valid.
   - Collect a **network waterfall** and (if runtime issues) a **Performance profile**.

2. **Identify bottlenecks**
   - **LCP**: slow hero media, render-blocking CSS/JS, slow TTFB, missing preload.
   - **INP**: long tasks on input, heavy hydration, expensive renders, too much JS.
   - **CLS**: missing dimensions, late-inserted UI, font swap shifts.
   - **Network**: too many requests, large assets, no compression, poor caching headers.
   - **Bundles**: oversized vendor chunks, duplicated deps, no code splitting, dead code.

3. **Prioritize (high impact, low risk first)**
   - Fix **LCP element** delivery and critical rendering path first.
   - Reduce **main-thread work** that hurts INP (often “too much JS”).
   - Eliminate CLS sources (usually fast wins).
   - Only then micro-optimize.

4. **Implement optimizations**
   - **Images/media**: modern formats (AVIF/WebP), responsive `srcset`, correct `width`/`height` or `aspect-ratio`, compress, CDN.
   - **JS**: code split + lazy load, remove/replace heavy deps, defer non-critical scripts, reduce hydration cost.
   - **CSS/fonts**: inline critical CSS, defer non-critical CSS, remove unused CSS, `font-display: swap`, preload critical fonts sparingly.
   - **Caching**: long-lived caching for hashed static assets, CDN caching, compression (Brotli/Gzip), sensible revalidation for HTML/data.

5. **Verify improvement**
   - Re-run the same measurements under the same conditions.
   - Summarize **before/after deltas** and note trade-offs (e.g., cache staleness, image quality).
   - If available, add/confirm **RUM** for Core Web Vitals to avoid “lab-only” wins.

## Default targets (guidance)

- **LCP**: ≤ 2.5s (good)
- **INP**: ≤ 200ms (good)
- **CLS**: ≤ 0.1 (good)
- **TTFB**: ≤ 600ms (good starting point)

## Output format (recommended)

```markdown
## Baseline (lab)
- **URL:** ...
- **Device/network:** ...
- **LCP / INP / CLS:** ...
- **Lighthouse performance:** ...

## Top issues (ranked)
1. <issue> — impact on metric(s) — evidence
2. ...

## Plan (high → low ROI)
- [ ] Change ...

## Verification
- Before: ...
- After: ...
```

## Additional resources

- Step-by-step fixes and checklists: [reference.md](reference.md)
- End-to-end example writeups: [examples.md](examples.md)
