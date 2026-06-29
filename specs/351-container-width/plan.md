# Implementation Plan: Trip Work Surface Width

**Branch**: `tasks/issue-351-container-width` | **Date**: 2026-06-29 | **Spec**: `specs/351-container-width/spec.md`
**Input**: Feature specification from `specs/351-container-width/spec.md`

## Summary

Introduce a shared trip work-surface width helper and apply it to the list and schedule views so desktop headers and tables align consistently. Leave the map route unchanged because it is a spatial canvas view.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Next.js 14 App Router
**Primary Dependencies**: `next`, `react`, `tailwindcss`
**Storage**: Not applicable
**Testing**: `npm run lint`, `npx tsc --noEmit`, `git diff --check`, `npm run build`
**Target Platform**: Trip list and schedule pages
**Project Type**: Next.js web application
**Performance Goals**: No extra rendering work or data fetching
**Constraints**: Preserve mobile layouts and avoid changing map canvas behavior
**Scale/Scope**: Layout wrappers for two trip work-surface routes

## Constitution Check

Repository constitution is scaffold placeholders. Applicable gates from `AGENTS.md`:

- Entry point consistency: list and schedule page controls align consistently.
- Sizing: shared desktop max-width replaces per-page ad hoc width choices.
- Design system mechanics: use Tailwind utility composition without new hex values or arbitrary spacing.

## Project Structure

### Documentation (this feature)

```text
specs/351-container-width/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
app/trip/[tripId]/list/page.tsx
app/trip/[tripId]/schedule/page.tsx
lib/tripLayout.ts
```

**Structure Decision**: Keep the shared width rule in `lib/tripLayout.ts` so related trip pages can reuse one token without introducing a new component wrapper.

## Complexity Tracking

No added architectural complexity.

## Process Note

The repo-local `.codex/prompts/speckit.*.md` files referenced by the Speckit skills are absent. This feature uses the checked-in `.specify/templates` structure directly.
