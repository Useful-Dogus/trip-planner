# Tasks: Schedule Date Header Hierarchy

**Input**: `specs/357-date-header/spec.md`, `specs/357-date-header/plan.md`  
**Prerequisites**: Issue #357

## Phase 1: Implementation

- [x] T001 [US1] Increase date header typography and vertical rhythm in `components/Schedule/DateGroupHeader.tsx`.
- [x] T002 [US1] Strengthen section boundaries and drop target state without direct color values in `components/Schedule/DateGroupHeader.tsx`.
- [x] T003 [US1] Keep secondary metadata responsive so it does not dominate the date label in `components/Schedule/DateGroupHeader.tsx`.

## Phase 2: Verification

- [x] T004 Run `npm run lint`.
- [x] T005 Run `npm run build`.

## Dependencies & Execution Order

T001, T002, and T003 affect the same component and should be completed together. T004 and T005 run after implementation.
