# Tasks: 패널 기반의 끊김 없는 편집 경험

**Input**: Design documents from `/specs/003-panel-editing-ux/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 패널 컴포넌트 디렉토리 구조 준비

- [x] T001 `components/Panel/` 디렉토리 생성 (신규 패널 컴포넌트 홈)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 유저 스토리가 공유하는 타입 및 prop 인터페이스 준비

**⚠️ CRITICAL**: 이 단계가 완료되어야 ItemCard/ItemList/ResearchPage 변경 가능

- [x] T002 `components/Items/ItemCard.tsx` — `onSelect?: (id: string) => void`, `isActive?: boolean` prop 추가 및 `<Link>` 를 `<div onClick>` 로 교체
- [x] T003 `components/Items/ItemList.tsx` — `selectedItemId: string | null`, `onSelectItem: (id: string) => void` prop 추가, 각 ItemCard에 전달

**Checkpoint**: Foundation ready — 이후 단계가 독립적으로 진행 가능

---

## Phase 3: User Story 1 - 패널/시트 UI 인프라 (Priority: P1) 🎯 MVP

**Goal**: 리스트 항목 클릭 시 데스크탑에서는 사이드 패널, 모바일에서는 바텀 시트가 열리고 닫히는 UI 컨테이너 완성

**Independent Test**: `npm run dev` 후 리스트 항목 클릭 시 패널/시트가 열리고, ESC/스와이프/닫기버튼/외부클릭으로 닫히는지 확인

### Implementation for User Story 1

- [x] T004 [US1] `components/Panel/ItemPanel.tsx` 신규 작성 — `ItemPanelProps { item, isOpen, onClose, onSave, onDelete }` 인터페이스 정의
- [x] T005 [US1] `components/Panel/ItemPanel.tsx` — 데스크탑 사이드 패널 레이아웃: `fixed right-0 top-0 h-full w-[440px] bg-white shadow-2xl`, `translate-x-full` → `translate-x-0` CSS transition (300ms)
- [x] T006 [US1] `components/Panel/ItemPanel.tsx` — 모바일 바텀 시트 레이아웃: `fixed bottom-0 left-0 right-0 rounded-t-2xl max-h-[88vh] bg-white`, `translate-y-full` → `translate-y-0` CSS transition (300ms), Tailwind `md:` prefix로 데스크탑/모바일 분기
- [x] T007 [US1] `components/Panel/ItemPanel.tsx` — 반투명 백드롭 오버레이 추가 (`fixed inset-0 bg-black/20`), 클릭 시 `onClose()` 호출
- [x] T008 [US1] `components/Panel/ItemPanel.tsx` — ESC 키 닫기: `useEffect`로 `keydown` 이벤트 등록, `event.key === 'Escape'` 시 `onClose()`
- [x] T009 [US1] `components/Panel/ItemPanel.tsx` — 스와이프 다운 닫기: `touchstart`/`touchmove`/`touchend` 이벤트로 Y delta > 50px 시 `onClose()`
- [x] T010 [US1] `app/research/page.tsx` — `selectedItemId: string | null` 상태 추가, `ItemList`에 `selectedItemId`/`onSelectItem` prop 전달, `ItemPanel` 렌더링

**Checkpoint**: 패널 열림/닫힘 완성. ✓

---

## Phase 4: User Story 2 - 인라인 상세보기/편집 통합 (Priority: P2)

**Goal**: 패널 내에서 항목 상세 정보 읽기 및 인라인 편집(저장/삭제) 가능. 저장 시 리스트 카드 즉시 갱신.

**Independent Test**: 리스트 항목 클릭 → 패널에 상세 정보 표시, 편집 버튼 클릭 → 편집 폼 인라인 표시, 저장 → 패널 유지하며 리스트 카드 갱신 확인

### Implementation for User Story 2

- [x] T011 [P] [US2] `components/Panel/PanelItemForm.tsx` 신규 작성 — `PanelItemFormProps { item: TripItem, onSave: (updated: TripItem) => void, onCancel: () => void, onDelete: (id: string) => void }` 인터페이스 정의
- [x] T012 [US2] `components/Panel/PanelItemForm.tsx` — 기존 `ItemForm`의 폼 필드 구현 (이름, 카테고리, 상태, 우선순위, 날짜, 시간, 예산, 주소, 링크, 메모), `router.push` 대신 `onSave(updatedItem)` 콜백
- [x] T013 [US2] `components/Panel/PanelItemForm.tsx` — 저장 핸들러: `PUT /api/items/{id}` 호출 → 응답의 `item`으로 `onSave(item)` 호출, 에러 시 패널 내 인라인 에러 메시지 표시
- [x] T014 [US2] `components/Panel/PanelItemForm.tsx` — 삭제 핸들러: `DELETE /api/items/{id}` 호출 → `onDelete(id)` 콜백, `confirm()` 다이얼로그 포함
- [x] T015 [US2] `components/Panel/ItemPanel.tsx` — `panelMode: 'view' | 'edit'` 내부 상태 추가, view 모드: 상세 정보 인라인 렌더링 (이름, 배지, 일정, 위치, 링크, 메모 섹션)
- [x] T016 [US2] `components/Panel/ItemPanel.tsx` — edit 모드: `PanelItemForm` 렌더링, '편집' 버튼으로 view→edit 전환, '취소' 버튼으로 edit→view 복귀
- [x] T017 [US2] `app/research/page.tsx` — `onSave` 콜백 구현: items 배열 교체, `onDelete` 콜백 구현: items 필터링 + selectedItemId(null)

**Checkpoint**: 패널에서 읽기 및 편집 완전 동작. ✓

---

## Phase 5: User Story 3 - 활성 상태 및 애니메이션 Polish (Priority: P3)

**Goal**: 선택된 항목 카드의 Active State 강조 표시, 다른 항목 선택 시 패널 콘텐츠 교체, 필터 변경으로 항목 사라질 때 패널 닫기

**Independent Test**: 카드 클릭 시 해당 카드에 강조 스타일 표시, 다른 카드 클릭 시 강조가 이동하며 패널 콘텐츠 갱신, 필터로 선택 항목 제외 시 패널 자동 닫힘 확인

### Implementation for User Story 3

- [x] T018 [P] [US3] `components/Items/ItemCard.tsx` — `isActive` prop에 따라 Active State 스타일 적용: `ring-1 ring-gray-300 bg-gray-50 border-gray-400`
- [x] T019 [US3] `components/Items/ItemList.tsx` — 필터 변경 시 `selectedItemId`가 결과에 없으면 `onSelectItem` 호출로 패널 닫기 (useRef로 onSelectItem 안정화)
- [x] T020 [US3] `components/Panel/ItemPanel.tsx` — `item.id` 변경 시 `mode`를 `'view'`로 리셋 (useEffect)

**Checkpoint**: 모든 유저 스토리 완성. ✓

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 빌드 통과 확인 및 접근성 개선

- [x] T021 `npm run build` 실행 — 통과 ✓
- [x] T022 `npm run lint` 실행 — 통과 ✓
- [x] T023 [P] `components/Panel/ItemPanel.tsx` — `aria-label="항목 상세 패널"`, 닫기 버튼 `aria-label="패널 닫기"` 추가 ✓ (이미 포함)
- [ ] T024 [P] `components/Panel/ItemPanel.tsx` — 패널 오픈 시 첫 포커스 요소로 포커스 이동

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 즉시 시작 가능
- **Phase 2 (Foundational)**: Phase 1 완료 후 시작
- **Phase 3 (US1)**: Phase 2 완료 후 시작
- **Phase 4 (US2)**: Phase 3 완료 후 시작
- **Phase 5 (US3)**: Phase 4 완료 후 시작
- **Phase 6 (Polish)**: Phase 5 완료 후 시작

### Parallel Opportunities (Phase 내)

- T018, T019 는 서로 다른 파일이므로 [P] 병렬 가능

---

## Implementation Strategy

### 3 Commits

1. **커밋 1** — Phase 1 + Phase 2 + Phase 3: 패널 UI 인프라 완성 (ItemCard/ItemList 인터페이스 + ItemPanel 셸)
2. **커밋 2** — Phase 4: 인라인 상세보기/편집 통합 (PanelItemForm + ResearchPage 완전 연결)
3. **커밋 3** — Phase 5 + Phase 6: Active State, Polish, 빌드 통과

---

## Notes

- [P] 태스크는 서로 다른 파일이며 의존성 없음
- `PanelItemForm`은 기존 `ItemForm`을 수정하지 않으므로 기존 `/items/[id]/edit` 페이지 영향 없음
- `onSelect`/`isActive` optional prop으로 schedule 페이지 하위 호환성 유지
