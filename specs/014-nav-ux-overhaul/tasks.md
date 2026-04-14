# Tasks: Trip Planner 다음 버전 UX 개편

**Input**: Design documents from `specs/014-nav-ux-overhaul/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓

**Organization**: 7개 User Story 기준으로 구성. 각 Story는 독립적으로 구현/검증 가능.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 해당 User Story 레이블 (US1-US7)

---

## Phase 1: Setup (공유 인프라)

**목적**: 신규 파일 생성 및 기존 코드 베이스 파악

- [ ] T001 현재 `components/Layout/Navigation.tsx` 전체 내용 확인 및 변경 계획 수립
- [ ] T002 [P] 현재 `app/research/page.tsx` 전체 내용 확인
- [ ] T003 [P] 현재 `app/schedule/page.tsx` 전체 내용 확인
- [ ] T004 [P] 현재 `app/gmaps-import/page.tsx` 전체 내용 확인
- [ ] T005 [P] 현재 `components/Research/ResearchTable.tsx` 전체 내용 확인
- [ ] T006 [P] 현재 `components/Schedule/ScheduleTable.tsx` 전체 내용 확인

---

## Phase 2: Foundational (공통 선행 작업)

**목적**: 다른 Story에서 공통으로 필요한 기반 작업

**⚠️ CRITICAL**: 이 Phase 완료 전에는 User Story 구현 시작 불가

- [ ] T007 `components/UI/FAB.tsx` 신규 생성 — 모바일 FAB 컴포넌트 (onClick prop, fixed positioning)
- [ ] T008 [P] `app/map/page.tsx` 신규 생성 — 통합 지도 탭 페이지 (ResearchMap 재사용, selectedItemId + ItemPanel 포함)

**Checkpoint**: FAB 컴포넌트 및 지도 탭 페이지 준비 완료

---

## Phase 3: User Story 1 - 탭 구조 개편 (Priority: P1) 🎯 MVP

**Goal**: 4탭 → 3탭(전체·일정·지도) 개편, 추가/지도연동 탭 제거

**Independent Test**: 앱 열어서 네비게이션 탭 3개(전체, 일정, 지도)만 표시되는지 확인. 각 탭 클릭 시 올바른 뷰로 이동 확인.

### Implementation for User Story 1

- [ ] T009 [US1] `components/Layout/Navigation.tsx` 수정 — navItems에서 `/items/new`, `/gmaps-import` 제거, 지도 탭(`/map`) 추가, "리서치" → "전체" 레이블 변경
- [ ] T010 [US1] `components/Layout/Navigation.tsx` 수정 — 데스크탑 사이드바 하단에 지도연동 보조 아이콘 버튼 추가 (`/gmaps-import` 링크)

**Checkpoint**: 탭 3개로 변경 완료. `/map` 라우트 접근 가능.

---

## Phase 4: User Story 2 - 기기별 뷰 자동결정 + overflow 버그 수정 (Priority: P2)

**Goal**: 모바일=카드 고정, 데스크탑=테이블 고정. 뷰 토글 제거. 테이블 overflow 버그 수정.

**Independent Test**: 모바일(< 768px)에서 전체 탭 열면 카드만 보임. 데스크탑(≥ 768px)에서 테이블만 보임. 뷰 전환 버튼 없음.

### Implementation for User Story 2

- [ ] T011 [US2] `app/research/page.tsx` 수정 — `tab` state 및 TabSwitcher 컴포넌트 제거. `md:hidden` 래퍼에 `ItemList`+`FAB`, `hidden md:block` 래퍼에 `ResearchTable` 렌더링으로 교체
- [ ] T012 [P] [US2] `components/Research/ResearchTable.tsx` 수정 — line 155의 `overflow-hidden` → `overflow-x-auto` 변경
- [ ] T013 [P] [US2] `app/schedule/page.tsx` 수정 — `tab` state 및 TabSwitcher 제거. 테이블 뷰만 남기고 지도는 `/map` 탭으로 이동 (schedule 페이지에서 map sub-tab 제거)

**Checkpoint**: 모바일/데스크탑 뷰 자동 분기 완료. 테이블 overflow 수정 완료.

---

## Phase 5: User Story 3 - 모바일 FAB (Priority: P2)

**Goal**: 모바일 전체 탭 우하단에 FAB(+) 버튼. 클릭 시 `/items/new` 이동.

**Independent Test**: 모바일에서 전체 탭(`/research`) 열면 우하단 FAB 표시. 탭하면 `/items/new` 이동. 일정/지도 탭에서는 FAB 없음.

### Implementation for User Story 3

- [ ] T014 [US3] `app/research/page.tsx` 수정 — T007에서 만든 `FAB` 컴포넌트를 모바일 래퍼(`md:hidden` 영역) 안에 추가. `router.push('/items/new')` 연결

**Checkpoint**: 모바일 FAB 동작 확인.

---

## Phase 6: User Story 4 - 임포트 완료 후 자동이동 + 하이라이트 (Priority: P3)

**Goal**: 임포트 완료 시 자동으로 `/research`로 이동. 신규 아이템 노란 하이라이트.

**Independent Test**: 구글맵 URL로 아이템 1개 이상 가져오면 전체 탭으로 이동. 신규 아이템에 약 1초간 노란 배경 표시.

### Implementation for User Story 4

- [ ] T015 [US4] `app/gmaps-import/page.tsx` 수정 — done 상태에서 정적 `<a href>` 제거. `useEffect`로 `router.push('/research?imported=' + insertedIds.join(','))` 자동 리다이렉트 구현. insertedIds를 state로 추적 (API 응답에서 수집)
- [ ] T016 [US4] `app/research/page.tsx` 수정 — `searchParams.get('imported')` 파싱, `highlightedIds: Set<string>` state 추가. 마운트 시 imported param 읽어 하이라이트 set, 1000ms 후 초기화, URL에서 param 제거
- [ ] T017 [US4] `components/Items/ItemList.tsx` 수정 — `highlightedIds?: Set<string>` prop 추가. ItemCard에 `isHighlighted` prop 전달. 하이라이트 시 Tailwind `animate-pulse bg-yellow-100` 클래스 적용

**Checkpoint**: 임포트 후 자동 이동 및 하이라이트 동작 확인.

---

## Phase 7: User Story 5 - 일정 탭 미배정 버킷 (Priority: P3)

**Goal**: 일정 탭 최상단에 미배정 아이템 섹션 표시. 접기/펼치기 가능.

**Independent Test**: 날짜 없는 아이템 있을 때 일정 탭 열면 최상단에 "미배정 N개" 섹션 표시. 헤더 클릭으로 접기/펼치기. 아이템 0개면 섹션 없음.

### Implementation for User Story 5

- [ ] T018 [US5] `components/Schedule/ScheduleTable.tsx` 수정 — 미배정(`UNDATED_KEY`) 항목을 기존 그룹 정렬에서 분리. `undatedCollapsed` state 추가. 최상단에 미배정 섹션 렌더링 (아이템 있을 때만). 접기/펼치기 토글 구현. 기존 그룹 정렬에서 UNDATED_KEY 제거.

**Checkpoint**: 일정 탭 미배정 버킷 동작 확인.

---

## Phase 8: User Story 6 - 오늘 날짜 자동 스크롤 (Priority: P3)

**Goal**: 오늘 날짜에 배정된 아이템이 있으면 일정 탭 진입 시 오늘 섹션으로 자동 스크롤. "오늘" 배지 표시.

**Independent Test**: 오늘 날짜에 배정된 아이템 있는 상태에서 일정 탭 열면 오늘 섹션이 화면에 보임. 섹션 헤더에 "오늘" 배지 확인.

### Implementation for User Story 6

- [ ] T019 [US6] `components/Schedule/ScheduleTable.tsx` 수정 — `todayKey` 계산 (`new Date().toISOString().slice(0,10)`). 오늘 섹션 헤더에 ref 연결. `useEffect`로 마운트 시 오늘 그룹에 아이템이 있으면 `scrollIntoView({ behavior: 'smooth', block: 'start' })` 실행. 오늘 헤더에 "오늘" 배지 추가.

**Checkpoint**: 오늘 자동 스크롤 및 배지 동작 확인.

---

## Phase 9: User Story 7 - URL param 패널 상태 복원 (Priority: P4)

**Goal**: 패널 열릴 때 URL에 `?item=ID` 반영. 탭 전환 후 돌아와도 패널 복원.

**Independent Test**: 아이템 패널 열고 URL에 `?item=...` 파라미터 확인. 다른 탭 이동 후 뒤로 가기 시 패널 복원. 존재하지 않는 ID는 파라미터 제거.

### Implementation for User Story 7

- [ ] T020 [US7] `app/research/page.tsx` 수정 — `useSearchParams`로 초기 `selectedItemId` 설정. `handleSelectItem` 함수에서 `router.replace`로 `?item=ID` 동기화. invalid ID 감지 시 param 제거
- [ ] T021 [P] [US7] `app/schedule/page.tsx` 수정 — 동일한 URL param 패턴 적용 (T020과 동일 로직)
- [ ] T022 [P] [US7] `app/map/page.tsx` 수정 — 동일한 URL param 패턴 적용

**Checkpoint**: 세 탭 모두 URL param 패널 상태 복원 동작 확인.

---

## Phase 10: Polish & 품질 게이트

**목적**: 빌드 및 린트 검증, 엣지 케이스 처리

- [ ] T023 [P] `app/research/page.tsx` 검토 — `?item`과 `?imported` param이 동시에 있을 때 충돌 없는지 확인. `?item` 처리 후 `?imported` 처리 순서 보장.
- [ ] T024 [P] `app/gmaps-import/page.tsx` 검토 — 가져온 아이템 ID를 API 응답에서 추출하는 로직 확인. 0개일 때 `/research`로 이동 (param 없음) 확인.
- [ ] T025 `npm run build` 실행 — 타입 에러, 빌드 에러 수정
- [ ] T026 `npm run lint` 실행 — 린트 에러 수정

---

## Dependencies & Execution Order

### Phase 의존성

- **Phase 1 (Setup)**: 즉시 시작 가능
- **Phase 2 (Foundational)**: Phase 1 완료 후 — T007(FAB), T008(지도탭) 병렬 가능
- **Phase 3 (US1)**: Phase 2 완료 후 시작 — 이후 US들의 탭 구조 전제
- **Phase 4-9 (US2-US7)**: Phase 3 완료 후 — 상호 독립적으로 병렬 가능
- **Phase 10 (Polish)**: 모든 구현 완료 후

### User Story 의존성

- **US1 (탭 구조)**: Phase 2 완료 후 → 다른 모든 US의 전제
- **US2 (뷰 자동결정)**: US1 완료 후 독립 구현 가능
- **US3 (FAB)**: T007(FAB 컴포넌트) 완료 후 독립 구현 가능
- **US4 (임포트 하이라이트)**: 독립 구현 가능
- **US5 (미배정 버킷)**: 독립 구현 가능
- **US6 (오늘 스크롤)**: US5와 같은 파일 — 순서 실행 권장 (US5 완료 후)
- **US7 (URL param)**: 독립 구현 가능 (T020, T021, T022 병렬 가능)

### 병렬 실행 기회

```
Phase 2 병렬: T007(FAB) + T008(지도탭 페이지)
Phase 4 병렬: T012(ResearchTable overflow) + T013(schedule tab 정리)
Phase 7+8 병렬: US5 완료 즉시 US6 착수 (같은 파일, 순서 진행)
Phase 9 병렬: T020(research) + T021(schedule) + T022(map) URL param
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup 완료
2. Phase 2: FAB + 지도탭 준비
3. Phase 3: 탭 구조 개편 (US1)
4. **STOP & VALIDATE**: 3탭 네비게이션 동작 확인
5. 이후 US 순서대로 추가

### Incremental Delivery

1. US1 (탭 구조) → 기본 네비게이션 완성
2. US2+US3 (뷰 자동결정 + FAB) → 모바일 UX 완성
3. US4 (임포트 하이라이트) → 임포트 UX 개선
4. US5+US6 (미배정 버킷 + 오늘 스크롤) → 일정 탭 개선
5. US7 (URL param) → 상태 복원 완성

---

## Notes

- [P] = 다른 파일, 의존성 없음 → 병렬 실행 가능
- US5와 US6은 같은 파일(`ScheduleTable.tsx`) 수정 → 순서대로 실행
- T015(임포트 리다이렉트)는 API 응답에서 insertedIds 추출이 전제 — gmaps-import API 응답 구조 먼저 확인
- `app/schedule/page.tsx`에서 map sub-tab 제거 시 ScheduleMap 컴포넌트 참조도 함께 정리
