# Implementation Plan: Schedule Date Change Controls

**Branch**: `tasks/issue-356-date-change-controls` | **Date**: 2026-06-29 | **Spec**: `specs/356-date-change-controls/spec.md`
**Input**: Feature specification from `specs/356-date-change-controls/spec.md`

## Summary

Remove mobile item drag handles, add an explicit mobile date-change button per card, and make the desktop row date button visible and labeled while preserving desktop drag-and-drop.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Next.js 14 App Router
**Primary Dependencies**: `next`, `react`, `@dnd-kit/core`
**Storage**: Existing item update hook/API
**Testing**: `npm run lint`, `npx tsc --noEmit`, `npm run build`
**Target Platform**: Mobile and desktop schedule views
**Project Type**: Next.js web application
**Performance Goals**: No additional network calls beyond existing date update
**Constraints**: Preserve desktop drag-and-drop; avoid a broader schedule table redesign
**Scale/Scope**: Schedule table row and mobile schedule card

## Constitution Check

Repository constitution is scaffold placeholders. Applicable gates from `AGENTS.md`:

- UI control is visible without hover on mobile and desktop.
- Mobile scroll interaction takes precedence over drag gestures.
- No new design tokens or arbitrary colors.

## Project Structure

### Documentation (this feature)

```text
specs/356-date-change-controls/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
components/Schedule/ScheduleTable.tsx
components/Schedule/TableRow.tsx
```

**Structure Decision**: Keep the change inside existing schedule components. A separate shared date button abstraction can wait until another view needs it.

## Complexity Tracking

No added architectural complexity.

## Process Note

The repo-local `.codex/prompts/speckit.*.md` files referenced by the Speckit skills are absent. This feature uses the checked-in `.specify/templates` structure directly.
