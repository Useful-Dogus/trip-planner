# Tasks: Trip Work Surface Width

**Input**: `specs/351-container-width/spec.md`, `specs/351-container-width/plan.md`
**Prerequisites**: Issue #351 acceptance criteria

## Phase 1: Shared Layout Rule

- [x] T001 Add a shared trip work-surface width helper in `lib/tripLayout.ts`.
- [x] T002 Apply the shared width to schedule header, loading, and table wrappers in `app/trip/[tripId]/schedule/page.tsx`.
- [x] T003 Apply the shared width to list desktop header, warning, skeleton, and table wrappers in `app/trip/[tripId]/list/page.tsx`.
- [x] T004 Confirm the map route remains unchanged.

## Phase 2: Verification

- [x] T005 Run `npm run lint`.
- [x] T006 Run `npx tsc --noEmit`.
- [x] T007 Run `git diff --check`.
- [x] T008 Run `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy npm run build`.

## Dependencies & Execution Order

- T001 before T002-T003.
- T002-T004 before verification.
