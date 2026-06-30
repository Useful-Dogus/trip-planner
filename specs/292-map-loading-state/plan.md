# Implementation Plan: Map Loading State Alignment

**Branch**: `codex/292-map-loading-state` | **Date**: 2026-06-30 | **Spec**: `specs/292-map-loading-state/spec.md`

## Summary

Add a dedicated map route loading shell that mirrors the final map work surface: desktop side panel plus map canvas, and mobile map plus bottom drawer. Keep the change route-scoped so list and schedule loading behavior is unaffected.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18  
**Primary Dependencies**: Next.js 14 App Router, Tailwind CSS 3.x  
**Storage**: N/A  
**Testing**: `npm run lint`, `npm run build`  
**Target Platform**: Web, responsive mobile and desktop  
**Project Type**: Next.js App Router frontend  
**Constraints**: Route-scoped loading state; no fake map data; preserve final map layout dimensions

## Constitution Check

- Basics-first: keeps navigation and map work surface context visible during loading.
- Design: uses existing `Skeleton`, semantic tokens, and final layout dimensions.
- Refactoring: no changes to data loading or map behavior.

## Project Structure

```text
app/trip/[tripId]/map/loading.tsx
specs/292-map-loading-state/
├── spec.md
├── plan.md
└── tasks.md
```

**Structure Decision**: The issue targets map view loading, so the fix belongs in the map route segment rather than the shared trip loading fallback.

## Complexity Tracking

No violations.
