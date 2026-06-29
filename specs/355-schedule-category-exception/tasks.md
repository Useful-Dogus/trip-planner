# Tasks: Schedule Category Cell Exception Recovery

**Input**: `specs/355-schedule-category-exception/spec.md`, `specs/355-schedule-category-exception/plan.md`
**Prerequisites**: Issue #355, existing schedule table implementation

## Phase 1: Category Cell Resilience

- [x] T001 [US1] Add safe category metadata fallback in `components/Schedule/cells/CategoryCell.tsx`.
- [x] T002 [US1] Guard category picker portal positioning against missing browser/document state and repeated invalid measurements in `components/Schedule/cells/CategoryCell.tsx`.
- [x] T003 [US1] Preserve accessible label/title text for fallback category display in `components/Schedule/cells/CategoryCell.tsx`.

## Phase 2: Recoverable Save Failure

- [x] T004 [US2] Preserve API error text when item update fails in `lib/hooks/useItems.ts`.
- [x] T005 [US2] Keep optimistic rollback and retry behavior intact in `lib/hooks/useItems.ts`.

## Phase 3: Verification

- [x] T006 Run `npm run lint`.
- [ ] T007 Manually verify category picker open/select behavior if local app credentials are available.

## Dependencies & Execution Order

- T001-T003 before T006.
- T004-T005 before T006.
- T007 after implementation and lint.
