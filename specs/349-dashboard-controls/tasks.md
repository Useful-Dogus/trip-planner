# Tasks: Dashboard Control Disclosure

**Input**: `specs/349-dashboard-controls/spec.md`, `specs/349-dashboard-controls/plan.md`
**Prerequisites**: Issue #349 acceptance criteria

## Phase 1: Dashboard Controls

- [x] T001 Add trip-count threshold for dashboard search/sort controls in `app/dashboard/DashboardClient.tsx`.
- [x] T002 Keep "새 여행" visible for non-empty dashboards in `app/dashboard/DashboardClient.tsx`.
- [x] T003 Align visible control heights in `app/dashboard/DashboardClient.tsx`.

## Phase 2: Verification

- [x] T004 Run `npm run lint`.
- [x] T005 Run `npx tsc --noEmit`.
- [x] T006 Run `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy npm run build`.
- [ ] T007 Manually verify 0-3 and 4+ trip states if local auth data is available.

## Dependencies & Execution Order

- T001-T003 before verification.
