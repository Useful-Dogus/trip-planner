# Implementation Plan: Dashboard Control Disclosure

**Branch**: `tasks/issue-349-dashboard-controls` | **Date**: 2026-06-29 | **Spec**: `specs/349-dashboard-controls/spec.md`
**Input**: Feature specification from `specs/349-dashboard-controls/spec.md`

## Summary

Add progressive disclosure to dashboard controls: hide search/sort for 1-3 trips, keep "새 여행" visible, and show search/sort at 4+ trips.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Next.js 14 App Router
**Primary Dependencies**: `next`, `react`, `swr`
**Storage**: Existing trips API/SWR cache
**Testing**: `npm run lint`, `npx tsc --noEmit`, `npm run build`
**Target Platform**: Dashboard page
**Project Type**: Next.js web application
**Performance Goals**: No extra fetches or recomputation
**Constraints**: Avoid changing trip card behavior or data fetching
**Scale/Scope**: Dashboard top controls only

## Constitution Check

Repository constitution is scaffold placeholders. Applicable gates from `AGENTS.md`:

- Entry point consistency: "새 여행" remains reachable.
- Copy honesty: no search/sort affordance shown when intentionally unavailable.
- Sizing: visible controls align to the same height.

## Project Structure

### Documentation (this feature)

```text
specs/349-dashboard-controls/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
app/dashboard/DashboardClient.tsx
```

**Structure Decision**: Keep the threshold local to dashboard rendering.

## Complexity Tracking

No added architectural complexity.

## Process Note

The repo-local `.codex/prompts/speckit.*.md` files referenced by the Speckit skills are absent. This feature uses the checked-in `.specify/templates` structure directly.
