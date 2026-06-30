# Implementation Plan: Schedule Date Header Hierarchy

**Branch**: `codex/357-date-header` | **Date**: 2026-06-30 | **Spec**: `specs/357-date-header/spec.md`

## Summary

Improve `DateGroupHeader` so date sections read as section headers rather than dense table rows. Keep the change scoped to presentation: spacing, border hierarchy, typography, and responsive wrapping.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18  
**Primary Dependencies**: Next.js 14, Tailwind CSS 3.x, `@dnd-kit/core`  
**Storage**: N/A  
**Testing**: `npm run lint`, `npm run build`  
**Target Platform**: Web, responsive mobile and desktop  
**Project Type**: Next.js App Router frontend  
**Constraints**: Existing design tokens only; no direct hex; 4px spacing scale

## Constitution Check

- Basics-first: context and CRUD unaffected; visual hierarchy improves schedule readability.
- Design: uses semantic Tailwind tokens and 4px spacing scale.
- Refactoring: no structural refactor mixed into this behavior/UI polish.

## Project Structure

```text
components/Schedule/DateGroupHeader.tsx
specs/357-date-header/
├── spec.md
├── plan.md
└── tasks.md
```

**Structure Decision**: This is a single component polish change with feature documentation under `specs/357-date-header`.

## Complexity Tracking

No violations.
