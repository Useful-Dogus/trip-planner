# Tasks: 목록 뷰 필터 UI 개선 (모바일 최적화)

**Input**: Design documents from `/specs/013-filter-ui-mobile/`
**Branch**: `013-filter-ui-mobile`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 다른 파일을 수정하므로 병렬 실행 가능
- **[Story]**: 연관된 User Story (US1-US4)

---

## Phase 1: Foundational — FilterState 타입 및 데이터 구조 정비

**Purpose**: 신규 컴포넌트들이 공통으로 사용하는 타입과 유틸리티를 먼저 확정한다.

**⚠️ CRITICAL**: Phase 2 이후 모든 컴포넌트가 이 타입에 의존한다.

- [x] T001 `components/Items/ItemList.tsx`에서 `FilterState` 인터페이스 추출 — `selCats`, `selTripPriorities`, `selReservationStatuses`, `showExcluded` 4개 필드를 하나의 `FilterState` 타입으로 통합하고, `activeCount` 계산 헬퍼(`getActiveFilterCount(state: FilterState): number`)를 같은 파일 상단에 정의한다. 아직 UI는 변경하지 않는다.

**Checkpoint**: T001 완료 후 `npm run build`가 통과하면 Phase 2 진행 가능

---

## Phase 2: User Story 1 — 필터 없이 목록에 빠르게 접근 (P1) 🎯 MVP

**Goal**: 리서치 탭 진입 시 필터 칩이 보이지 않고 목록이 화면 상단에 바로 표시된다.

**Independent Test**: 리서치 탭을 열었을 때 스크롤 없이 첫 번째 아이템 카드가 보이면 통과.

- [x] T002 [US1] `components/Research/FilterButton.tsx` 신규 생성 — props: `activeCount: number`, `onClick: () => void`. 렌더: `"필터"` 텍스트 버튼, `activeCount > 0`일 때 `" (N)"` 텍스트를 버튼 레이블에 인라인 추가. 스타일: `px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors`.

- [x] T003 [US1] `components/Items/ItemList.tsx` 수정 — 기존 카테고리/우선순위/예약상태 칩 렌더링 블록(`<div className="space-y-2">` ~ 예약상태 칩 끝) 전체를 제거하고, 검색창 아래에 `<FilterButton activeCount={activeCount} onClick={() => setFilterPanelOpen(true)} />` 로 교체한다. `filterPanelOpen` 상태(`useState(false)`)를 추가한다. 필터 로직(filtered, renderEntries 계산)은 변경하지 않는다.

**Phase 2 완료 기준**: 리서치 탭에서 필터 칩이 보이지 않고 "필터" 버튼만 표시된다.

---

## Phase 3: User Story 2 — 필터 패널 열기 (P1)

**Goal**: 필터 버튼 탭 시 모바일에서 바텀시트, 데스크탑에서 드롭다운으로 필터 패널이 열린다.

**Independent Test**: 필터 버튼 탭 → 패널 열림 → "식당" 선택 → 닫기 → 목록이 식당만 표시.

- [x] T004 [P] [US2] `components/Research/FilterPanel.tsx` 신규 생성 — props: `isOpen: boolean`, `filterState: FilterState`, `onChange: (next: FilterState) => void`, `onClose: () => void`. 내용: 카테고리/우선순위/예약상태 칩 선택 UI (기존 `<Chip>` 컴포넌트 재사용), "제외 항목 보기" 토글 포함. 패널 헤더에 "필터" 제목과 닫기(×) 버튼. 하단에 "전체 초기화" 버튼(`activeCount > 0`일 때만 표시). 바텀시트/드롭다운 래퍼는 T005에서 추가한다.

- [x] T005 [US2] `components/Research/FilterPanel.tsx` 수정 — 모바일 바텀시트 래퍼 추가: `fixed bottom-0 left-0 right-0 z-[900] rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden` + `isOpen ? 'translate-y-0' : 'translate-y-full'`. backdrop div 추가: `fixed inset-0 bg-black/30 z-[890] md:hidden`. 아래로 스와이프 감지: `onTouchStart`/`onTouchEnd`로 deltaY > 50이면 `onClose()` 호출. 드래그 핸들: `absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full`.

- [x] T006 [US2] `components/Research/FilterPanel.tsx` 수정 — 데스크탑 드롭다운 래퍼 추가: `hidden md:block absolute top-full left-0 mt-1 z-50 w-80 bg-white border border-gray-200 rounded-xl shadow-lg`. `useRef` + `useEffect`로 외부 클릭 감지하여 `onClose()` 호출. FilterButton을 감싸는 `relative` 컨테이너가 필요하므로 ItemList.tsx의 툴바 div에 `relative` 추가.

- [x] T007 [US2] `components/Items/ItemList.tsx` 수정 — `FilterPanel` 컴포넌트 import 및 렌더링 추가. `filterState` 객체 생성 및 `onChange` 핸들러 연결. 기존 `setSelCats`, `setSelTripPriorities`, `setSelReservationStatuses`, `setShowExcluded`를 `onChange`로 통합 처리.

**Phase 3 완료 기준**: 모바일에서 바텀시트로, 데스크탑에서 드롭다운으로 필터 패널이 열리고 닫힌다. 필터 적용이 목록에 반영된다.

---

## Phase 4: User Story 3 — 활성 필터 요약 칩 (P2)

**Goal**: 활성 필터 시 버튼 배지 + 인라인 요약 칩으로 현재 상태를 표시하고 개별 해제 가능.

**Independent Test**: "식당" + "확정" 필터 적용 후 버튼에 "(2)" 배지, 요약 칩 2개 표시, 각 × 탭 시 해제.

- [x] T008 [P] [US3] `components/Research/ActiveFilterChips.tsx` 신규 생성 — props: `chips: Array<{ id: string; label: string; onRemove: () => void }>`. 렌더: `flex overflow-x-auto gap-1.5 py-1` 컨테이너, 각 칩은 `flex-shrink-0 flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700` + × 버튼(`text-gray-400 hover:text-gray-600`). `chips.length === 0`이면 `null` 반환.

- [x] T009 [US3] `components/Items/ItemList.tsx` 수정 — `activeChips` 배열 계산 로직 추가: selCats의 각 항목 → `{ id: 'cat-${c}', label: c, onRemove: ... }`, selTripPriorities → `{ id: 'pri-${p}', label: p, ... }`, selReservationStatuses → `{ id: 'res-${s}', label: s, ... }`, showExcluded → `{ id: 'excluded', label: '제외 포함', ... }`. `ActiveFilterChips` 컴포넌트를 검색창과 목록 사이에 렌더링.

**Phase 4 완료 기준**: 활성 필터가 있으면 버튼에 "(N)" 표시, 요약 칩 표시, × 탭으로 개별 해제.

---

## Phase 5: User Story 4 — 정렬 버튼 분리 (P2)

**Goal**: 정렬 옵션을 독립된 버튼으로 분리하고 현재 정렬 상태를 버튼 레이블에 표시.

**Independent Test**: 정렬 버튼 탭 → 옵션 표시 → "날짜" 선택 → 버튼 레이블 "날짜 ↑" 표시.

- [x] T010 [P] [US4] `components/Research/SortButton.tsx` 신규 생성 — props: `sortKey: SortKey`, `sortDir: SortDir`, `onChange: (key: SortKey, dir: SortDir) => void`. 버튼 레이블: 현재 정렬 기준 이름 + (asc ? "↑" : "↓"). 탭 시 옵션 드롭다운 표시: 이름/날짜/예산/우선순위 4개 항목. 현재 선택된 항목은 체크 표시. 같은 항목 재선택 시 방향 토글. 드롭다운은 `absolute` 포지셔닝, outside click으로 닫기. 스타일: FilterButton과 동일한 기본 스타일.

- [x] T011 [US4] `components/Items/ItemList.tsx` 수정 — 기존 인라인 정렬 버튼 블록(`<div className="flex items-center gap-1.5 flex-wrap">`) 제거. `SortButton` 컴포넌트 import 및 FilterButton 옆에 배치. `handleSortChange` 로직을 SortButton의 `onChange` prop으로 연결.

**Phase 5 완료 기준**: 기존 인라인 정렬 버튼이 제거되고 SortButton 하나로 대체. 정렬 기능 동작 동일.

---

## Phase 6: Polish

**Purpose**: 접근성, 스크롤바 숨김, 최종 레이아웃 점검

- [x] T012 `components/Items/ItemList.tsx` 툴바 레이아웃 정리 — 검색창 + [FilterButton, SortButton] 버튼 그룹을 `flex items-center gap-2` 로 정렬. 버튼 그룹은 `flex items-center gap-1.5 ml-auto` (우측 정렬).

- [x] T013 `components/Research/ActiveFilterChips.tsx` 스크롤바 숨김 처리 — 컨테이너에 `-mx-4 px-4` (edge-to-edge) 및 `::-webkit-scrollbar { display: none }` 인라인 스타일 또는 Tailwind `scrollbar-hide` 플러그인 대신 `[&::-webkit-scrollbar]:hidden` 적용.

- [x] T014 `components/Research/FilterPanel.tsx` 접근성 처리 — 바텀시트/드롭다운에 `role="dialog"` 및 `aria-modal="true"` 추가. 열릴 때 첫 번째 체크박스/칩으로 포커스 이동 (`autoFocus` 또는 `useEffect` + `ref.focus()`). 닫기 버튼 `aria-label="필터 닫기"`.

- [x] T015 빌드 및 린트 통과 확인 — `npm run build && npm run lint` 실행. 오류 수정.

---

## Dependencies (완료 순서)

```
T001 → T002, T003 (병렬)
T002, T003 → T004, T005, T006 (T004는 병렬)
T004, T005, T006, T007 → T008, T009, T010, T011
T008, T009 → T012
T010, T011 → T012
T012 → T013, T014 (병렬)
T013, T014 → T015
```

## 병렬 실행 예시

**Phase 2-3 동시 진행 가능**:
- T004 (FilterPanel 내용 구현) ‖ 다른 작업

**Phase 4-5 동시 진행 가능**:
- T008 (ActiveFilterChips) ‖ T010 (SortButton)

## MVP 범위

Phase 1 + Phase 2 + Phase 3 (T001-T007)만 완료해도 배포 가능한 상태:
- 필터 칩이 숨겨지고 버튼으로 전환
- 모바일 바텀시트 + 데스크탑 드롭다운 작동
- 기존 필터 기능 100% 유지

Phase 4-5는 개선 사항이며 독립적으로 추가 가능.

## 전체 태스크 수

| Phase | 태스크 수 | Story |
|---|---|---|
| Foundational | 1 | - |
| Phase 2 (US1) | 2 | P1 MVP |
| Phase 3 (US2) | 4 | P1 |
| Phase 4 (US3) | 2 | P2 |
| Phase 5 (US4) | 2 | P2 |
| Polish | 4 | - |
| **합계** | **15** | |
