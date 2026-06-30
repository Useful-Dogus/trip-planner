# Tasks: Basecamp Role Clarification

**Input**: `specs/350-basecamp-role/spec.md`, `specs/350-basecamp-role/plan.md`
**Prerequisites**: Issue #350 acceptance criteria

## Phase 1: New Trip Creation

- [x] T001 Remove basecamp state, draft persistence, reset handling, and create payload usage from `app/dashboard/new/NewTripWizard.tsx`.
- [x] T002 Rename the new-trip wizard step 4 from basecamp to currency and remove the basecamp summary row from `app/dashboard/new/NewTripWizard.tsx`.

## Phase 2: Existing Trip Copy

- [x] T003 Update trip settings copy in `components/Trip/TripSettingsSheet.tsx` so `basecamp_address` is a single optional map reference point.
- [x] T004 Update shared trip and map labels in `app/share/[token]/page.tsx` and `components/Map/TripPlannerMap.tsx` to match the map reference wording.

## Phase 3: Verification

- [x] T005 Run `npm run lint`.
- [x] T006 Run `npx tsc --noEmit`.
- [x] T007 Run `git diff --check`.
- [x] T008 Run `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy npm run build`.

## Dependencies & Execution Order

- T001 before T002.
- T003-T004 can run after T001-T002.
- Verification runs after all implementation tasks.
