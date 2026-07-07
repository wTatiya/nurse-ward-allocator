# NiData vendor chunk map

Maintain when adding `manualChunks` rules in `vite.config.ts`.

| Chunk | Packages (representative) |
|-------|---------------------------|
| `vendor-react` | `react`, `react-dom`, `react-router-dom`, `scheduler` |
| `vendor-firebase` | `firebase/*` scoped packages |
| `vendor-style-utils` | `clsx`, `tailwind-merge`, `class-variance-authority` |
| `vendor-recharts` | `recharts` |
| `vendor-ui` | `framer-motion`, `lucide-react`, `@radix-ui/*`, `@headlessui/react`, `cmdk`, `react-select`, `tailwindcss-animate` |
| `vendor-data` | `@tanstack/react-table`, `@tanstack/react-query`, `@tanstack/react-query-devtools`, `xlsx`, `localforage` |
| `vendor-sanitize` | `isomorphic-dompurify`, `dompurify` |
| `vendor-jspdf` | `jspdf` |
| `vendor-pdf-addons` | `jspdf-autotable`, `html2canvas` |
| `app-reporting-data` | `src/services/dashboardData.ts` |
| `app-compliance-submissions` | `src/services/submissions.ts` (+ co-imported submission helpers) |
| `app-compliance-hydration` | `src/hooks/useSubmissionHydration.ts` |
| `app-compliance-checklists` | `src/lib/checklists.ts` |
| `app-supervisor-reporting-filters` | `src/components/SupervisorReportingFilterBar.tsx` (lazy from ComplianceHub) |
| `app-compliance-hub` | `src/components/ComplianceHub.tsx` only (shell + tab routing) |
| `app-compliance-helpers` | `src/components/ComplianceHub.helpers.ts` (constants, category scope, draft/storage helpers) |
| `app-compliance-widgets` | `src/components/ComplianceHub.widgets.tsx` (home grid cards, access guard) |
| `app-compliance-logic` | `src/components/ComplianceHub.logic.ts` |
| `app-compliance-submission-shape` | `src/services/submissionShape.ts` |
| `app-compliance-nursing-scoring` | `src/lib/nursingComplianceScoring.ts` |
| `app-compliance-parent-nursing-sync` | `src/lib/parentNursingSync.ts` |
| `app-compliance-cross-audit` | `src/lib/crossAudit.ts` |
