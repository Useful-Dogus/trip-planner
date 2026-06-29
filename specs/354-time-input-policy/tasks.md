# Tasks: Schedule Time Input Policy

**Input**: `specs/354-time-input-policy/spec.md`, `specs/354-time-input-policy/plan.md`
**Prerequisites**: Issue #354 acceptance criteria

## Phase 1: Shared Time Policy

- [x] T001 Add shared time input normalization in `lib/timeInput.ts`.
- [x] T002 Use shared normalization in `app/api/items/route.ts`.
- [x] T003 Use shared normalization in `app/api/items/[id]/route.ts`.

## Phase 2: Schedule Table Editing

- [x] T004 Normalize complete time drafts before `TimeCell` blur/Tab/Enter commits.
- [x] T005 Block partial/invalid drafts from Tab/Enter navigation in `components/Schedule/cells/TimeCell.tsx`.
- [x] T006 Show inline cell-level time errors in `components/Schedule/cells/TimeCell.tsx`.
- [x] T007 Allow clearing time via keyboard commit in `components/Schedule/TableRow.tsx`.

## Phase 3: Verification

- [x] T008 Probe parser examples with `npx tsx`.
- [x] T009 Run `npm run lint`.
- [x] T010 Run `npx tsc --noEmit`.
- [x] T011 Run `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy npm run build`.
- [ ] T012 Manually verify schedule table time editing if local auth data is available.

## Dependencies & Execution Order

- T001 before T002-T006.
- T004-T007 before verification.
