# Implementation Plan: Schedule Time Input Policy

**Branch**: `tasks/issue-354-time-input-policy` | **Date**: 2026-06-29 | **Spec**: `specs/354-time-input-policy/spec.md`
**Input**: Feature specification from `specs/354-time-input-policy/spec.md`

## Summary

Add a shared time parser/normalizer, use it in schedule table time cells before committing edits, and use it in item API validation before persisting time fields.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Next.js 14 App Router
**Primary Dependencies**: `next`, `react`, `swr`
**Storage**: Supabase-backed item records through existing item APIs
**Testing**: `npm run lint`, `npx tsc --noEmit`, `npm run build`, parser probe
**Target Platform**: Browser schedule table and Next.js API routes
**Project Type**: Next.js web application
**Performance Goals**: Synchronous parser only; no async work on keystrokes
**Constraints**: Keep table editing model intact and avoid broader spreadsheet redesign
**Scale/Scope**: Time cell, schedule table row save behavior, item POST/PATCH validation

## Constitution Check

Repository constitution is scaffold placeholders. Applicable gates from `AGENTS.md`:

- Behavior change is narrow and tied to #354.
- UI gives recoverable inline error near the edited cell.
- Server/client policies stay consistent through a shared helper.

## Project Structure

### Documentation (this feature)

```text
specs/354-time-input-policy/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
lib/timeInput.ts
components/Schedule/cells/TimeCell.tsx
components/Schedule/TableRow.tsx
app/api/items/route.ts
app/api/items/[id]/route.ts
```

**Structure Decision**: A small `lib/timeInput.ts` helper keeps UI and API behavior aligned without introducing a new form framework.

## Complexity Tracking

No added architectural complexity.

## Process Note

The repo-local `.codex/prompts/speckit.*.md` files referenced by the Speckit skills are absent. This feature uses the checked-in `.specify/templates` structure directly.
