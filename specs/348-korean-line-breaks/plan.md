# Implementation Plan: Korean Copy Line Break Quality

**Branch**: `codex/348-korean-line-breaks` | **Date**: 2026-06-30 | **Spec**: `specs/348-korean-line-breaks/spec.md`

## Summary

Add a reusable Korean text wrapping utility and apply it to the shared `EmptyState` component so major empty-state and onboarding copy avoids awkward one-character Korean line breaks.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18  
**Primary Dependencies**: Next.js 14, Tailwind CSS 3.x  
**Storage**: N/A  
**Testing**: `npm run lint`, `npm run build`  
**Target Platform**: Web, responsive mobile and desktop  
**Project Type**: Next.js App Router frontend  
**Constraints**: Use shared component and CSS utility; avoid one-off copy-specific layout hacks

## Constitution Check

- Basics-first: improves empty-state copy readability without changing CRUD or navigation behavior.
- Design: adds a reusable typography utility and documents the rule in `docs/design-guidelines.md`.
- Refactoring: no unrelated structural refactor.

## Project Structure

```text
app/globals.css
components/UI/EmptyState.tsx
docs/design-guidelines.md
specs/348-korean-line-breaks/
├── spec.md
├── plan.md
└── tasks.md
```

**Structure Decision**: Shared text wrapping belongs in global utilities; EmptyState consumes it so existing screens inherit the behavior.

## Complexity Tracking

No violations.
