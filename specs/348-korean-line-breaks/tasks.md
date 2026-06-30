# Tasks: Korean Copy Line Break Quality

**Input**: `specs/348-korean-line-breaks/spec.md`, `specs/348-korean-line-breaks/plan.md`  
**Prerequisites**: Issue #348

## Phase 1: Implementation

- [x] T001 [US1] Add reusable Korean wrapping utility in `app/globals.css`.
- [x] T002 [US1] Apply the utility to EmptyState title and description in `components/UI/EmptyState.tsx`.
- [x] T003 [US1] Adjust EmptyState description measure to reduce awkward narrow wrapping in `components/UI/EmptyState.tsx`.
- [x] T004 [US1] Document the rule in `docs/design-guidelines.md`.

## Phase 2: Verification

- [x] T005 Run `npm run lint`.
- [x] T006 Run `npm run build`.

## Dependencies & Execution Order

T001 precedes T002. T003 and T004 can be completed after the shared utility is defined. T005 and T006 run after implementation.
