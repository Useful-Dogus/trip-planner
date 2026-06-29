# Tasks: Schedule Date Change Controls

**Input**: `specs/356-date-change-controls/spec.md`, `specs/356-date-change-controls/plan.md`
**Prerequisites**: Issue #356 acceptance criteria

## Phase 1: Mobile Date Control

- [x] T001 Remove mobile schedule card draggable handle registration in `components/Schedule/ScheduleTable.tsx`.
- [x] T002 Add visible mobile date-change control in `components/Schedule/ScheduleTable.tsx`.
- [x] T003 Route mobile date changes through existing `onUpdateItem` path.

## Phase 2: Desktop Discoverability

- [x] T004 Make desktop row date-change control visible without hover in `components/Schedule/TableRow.tsx`.
- [x] T005 Add visible text label to desktop date-change control in `components/Schedule/TableRow.tsx`.

## Phase 3: Verification

- [x] T006 Run `npm run lint`.
- [x] T007 Run `npx tsc --noEmit`.
- [x] T008 Run `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy npm run build`.
- [ ] T009 Manually verify mobile scroll/date picker if local auth data is available.

## Dependencies & Execution Order

- T001-T003 before mobile verification.
- T004-T005 before desktop verification.
