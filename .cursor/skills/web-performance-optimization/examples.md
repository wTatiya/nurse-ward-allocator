# Web Performance Optimization – Examples

Use these as templates for audits and writeups. Adjust targets and priorities to your product context and traffic patterns.

---

## Example 1: Core Web Vitals audit and fixes

```markdown
## Performance Audit Results

### Current Metrics (Before)
- **LCP:** 4.2s ❌ (target < 2.5s)
- **INP/FID:** 180ms ❌ (target INP < 200ms; legacy FID < 100ms)
- **CLS:** 0.25 ❌ (target < 0.1)
- **Lighthouse Performance:** 62/100

### Issues Identified

1. **LCP:** Hero image is 2.5MB and loads late
2. **INP/FID:** Large JavaScript bundle blocks the main thread
3. **CLS:** Images without dimensions cause layout shifts

### Optimization Plan

#### Fix LCP

**Problem:** Hero image is too large

**Fix:**
```html
<!-- Modern formats + dimensions -->
<picture>
  <source srcset="/hero.avif" type="image/avif">
  <source srcset="/hero.webp" type="image/webp">
  <img
    src="/hero.jpg"
    alt="Hero"
    width="1200"
    height="600"
    loading="eager"
    fetchpriority="high"
  >
</picture>
```

Also:
- Compress hero to < 200KB
- Serve via CDN
- (Optional) preload the hero image

#### Fix INP/FID

**Problem:** Large JS bundle blocks input responsiveness

**Fix ideas:**
- Route/feature code splitting
- Lazy load heavy components
- Defer non-critical scripts (analytics, chat, A/B testing)

```html
<!-- Defer non-critical scripts -->
<script src="/analytics.js" defer></script>
```

#### Fix CLS

**Problem:** Media without reserved space

```html
<img
  src="/product.jpg"
  alt="Product"
  width="400"
  height="300"
  style="aspect-ratio: 4 / 3;"
>
```

### Results (After)

- **LCP:** 1.8s ✅
- **INP/FID:** 45ms ✅
- **CLS:** 0.05 ✅
- **Lighthouse Performance:** 94/100 ✅
```

---

## Example 2: Reducing JavaScript bundle size

```markdown
## Bundle Size Optimization

### Current State
- **Total Bundle:** 850KB (gzipped: 280KB)
- **Load Time (3G):** 8.2s

### Findings
1. Heavy date library
2. Whole-library imports
3. Dead code
4. No code splitting

### Plan

- Replace heavy dependencies (e.g., move to smaller alternatives)
- Use selective imports
- Add route/feature code splitting
- Ensure tree-shaking is effective

### Results
- **Total Bundle:** 380KB ✅
- **Load Time (3G):** 3.1s ✅
```

---

## Example 3: Image optimization strategy

```markdown
## Image Optimization

### Current Issues
- 15 images totaling 12MB
- No WebP/AVIF
- No responsive images
- No lazy loading

### Plan
1. Convert to modern formats (AVIF/WebP) + fallback
2. Add responsive images (`srcset`, `sizes`)
3. Lazy load below-the-fold images
4. Ensure dimensions are set to prevent CLS

### Results
- **Total Image Size:** 12MB → 1.8MB ✅
- **LCP:** 4.5s → 1.6s ✅
```
