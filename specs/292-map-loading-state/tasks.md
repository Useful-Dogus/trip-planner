# Tasks: Map Loading State Alignment

**Input**: `specs/292-map-loading-state/spec.md`, `specs/292-map-loading-state/plan.md`  
**Prerequisites**: Issue #292 latest map loading comment

## Phase 1: Implementation

- [x] T001 [US1] Add route-level map loading shell in `app/trip/[tripId]/map/loading.tsx`.
- [x] T002 [US1] Match desktop side panel plus map dimensions from `components/Plan/PlanScreen.tsx`.
- [x] T003 [US1] Match mobile map plus bottom drawer dimensions from `components/Plan/PlanScreen.tsx`.
- [x] T004 [US1] Avoid fake data markers or non-final badges in `app/trip/[tripId]/map/loading.tsx`.

## Phase 2: Verification

- [x] T005 Run `npm run lint`.
- [x] T006 Run `npm run build`.

## Dependencies & Execution Order

T001 is the main route artifact. T002-T004 are implementation checks inside the loading shell. T005 and T006 run after implementation.
