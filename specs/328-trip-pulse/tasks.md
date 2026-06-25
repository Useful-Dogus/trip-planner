# Tasks: Trip Pulse — 룰 기반 여행 상태 내레이션

**Input**: `specs/328-trip-pulse/spec.md`, `specs/328-trip-pulse/plan.md`  
**Scope**: 룰 기반 v1. DB/API/LLM/개인화/숨김 설정 없음.

## Phase 1: Foundational

- [X] T001 `lib/tripPulse.ts` 추가 — metrics 타입, `getTripPulseMetrics`, `getTripPulseSummary` 순수 함수 구현
- [X] T002 `scripts/check-trip-pulse.ts` 추가 — 최소 10개 대표 케이스 검증

## Phase 2: UI

- [X] T003 `components/Trip/TripPulse.tsx` 추가 — summary 표시 전용 컴포넌트

## Phase 3: Screen Integration

- [X] T004 [US1] `app/trip/[tripId]/list/page.tsx`에 목록용 Trip Pulse 연결
- [X] T005 [US2] `components/Map/MapSidePanel.tsx`에 지도용 Trip Pulse 연결
- [X] T006 [US3] `app/trip/[tripId]/schedule/page.tsx`에 일정용 Trip Pulse 연결

## Phase 4: Verification

- [X] T007 `npx tsx scripts/check-trip-pulse.ts` 실행
- [X] T008 `npm run lint` 실행
- [X] T009 `npm run build` 실행
- [X] T010 자체 diff review — 금지 표현, 지도 오버레이, URL 상태 영향, scope creep 확인
