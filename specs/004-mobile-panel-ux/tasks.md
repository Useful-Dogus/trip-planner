# Tasks: 모바일 패널 UX 개선

**Input**: Design documents from `/specs/004-mobile-panel-ux/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Organization**: 유저 스토리별 단계 구성 — 각 스토리를 독립적으로 구현·검증 가능

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: 다른 파일 또는 독립적인 함수 → 병렬 실행 가능
- **[Story]**: 해당 유저 스토리 (US1-US4)
- 모든 태스크에 정확한 파일 경로 포함

---

## Phase 1: Foundational (Props/State 인터페이스 리팩토링)

**Purpose**: US1-US4 전체의 전제 조건인 컴포넌트 Props/State 인터페이스 변경. 이 단계 완료 전까지 유저 스토리 구현 불가.

**⚠️ CRITICAL**: 이 단계 완료 후에야 각 유저 스토리 구현 시작 가능

- [x] T001 [P] `PanelItemFormProps`에서 `onDelete` 제거 및 `onDirtyChange: (dirty: boolean) => void` 추가, `components/Panel/PanelItemForm.tsx`
- [x] T002 [P] `ItemPanel`에 `isDirty: boolean`, `confirmingClose: boolean`, `keyboardHeight: number` 상태 추가, `components/Panel/ItemPanel.tsx`
- [x] T003 `handleDelete` 함수(API 호출 + `onDelete` 콜백)를 `PanelItemForm`에서 제거하고 `ItemPanel`로 이전, `components/Panel/ItemPanel.tsx` + `components/Panel/PanelItemForm.tsx`

**Checkpoint**: Props/State 인터페이스 변경 완료 — TypeScript 컴파일 에러 없음 확인

---

## Phase 2: User Story 1 - 편집 중 실수로 닫기 방지 (Priority: P1) 🎯 MVP

**Goal**: 편집 모드에서 변경사항이 있을 때 닫기 시도 시 인라인 확인 UI를 표시하여 데이터 손실을 방지한다.

**Independent Test**: 편집 모드에서 이름 필드를 수정 후 X 버튼 탭 → "변경사항이 있습니다" 메시지와 "나가기"/"계속 편집" 버튼이 패널 하단에 나타나야 함. "계속 편집" 탭 → 패널 유지. "나가기" 탭 → 패널 닫힘.

### Implementation for User Story 1

- [x] T004 [P] [US1] `PanelItemForm`에 `isDirty` 계산 `useEffect` 구현 — `form` 변경마다 원래 `item`과 비교 후 `onDirtyChange` 호출 (링크 비교 시 빈 URL 항목 제외), `components/Panel/PanelItemForm.tsx`
- [x] T005 [P] [US1] `ItemPanel`의 세 가지 close 트리거(X 버튼 onClick, 백드롭 onClick, `handleTouchEnd`) 수정 — `mode === 'edit' && isDirty`이면 `setConfirmingClose(true)`, 아니면 기존 `onClose()` 호출, `components/Panel/ItemPanel.tsx`
- [x] T006 [US1] `ItemPanel`의 `handleTouchEnd` 스와이프 핸들러에 `mode === 'edit'` 조기 반환 추가 — 편집 모드 중 스와이프 다운 제스처 비활성화, `components/Panel/ItemPanel.tsx`
- [x] T007 [US1] `ItemPanel` 헤더에 편집 모드 삭제 버튼 추가 — `mode === 'edit'`일 때만 X 버튼 왼쪽에 렌더링, T003에서 이전한 `handleDelete` 호출, `components/Panel/ItemPanel.tsx`
- [x] T008 [US1] `ItemPanel`에 인라인 확인 UI 구현 — `confirmingClose === true`일 때 패널 하단(sticky footer 자리)에 "변경사항이 있습니다" 메시지와 "나가기" / "계속 편집" 버튼 표시, `components/Panel/ItemPanel.tsx`
- [x] T009 [US1] `ItemPanel`의 ESC 키 핸들러 업데이트 — `confirmingClose` → `setConfirmingClose(false)`, `mode === 'edit' && isDirty` → `setConfirmingClose(true)`, 그 외 → `onClose()`, `components/Panel/ItemPanel.tsx`

**Checkpoint**: US1 완료 — 데이터 손실 없이 편집 모드 닫기 시나리오 전체 동작 확인

---

## Phase 3: User Story 2 - 액션 버튼 항상 접근 가능 (Priority: P2)

**Goal**: 편집 폼의 저장/취소 버튼을 sticky footer로 이동하고, Visual Viewport API로 가상 키보드 등장 시에도 버튼이 키보드 위에 보이도록 한다.

**Independent Test**: 편집 모드에서 텍스트 필드 탭해 가상 키보드 올리기 → 저장/취소 버튼이 키보드 바로 위에 표시되어야 함. 폼 콘텐츠를 스크롤해도 버튼은 고정된 채 유지.

### Implementation for User Story 2

- [x] T010 [US2] `PanelItemForm` 레이아웃 재구성 — `<form>`에 `flex flex-col h-full` 추가, 폼 필드를 `<div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-6">` 로 감싸기, 저장/취소 버튼을 `<div className="flex-shrink-0 px-5 py-3 border-t border-gray-100">` 로 분리, `components/Panel/PanelItemForm.tsx`
- [x] T011 [US2] `ItemPanel`의 콘텐츠 영역 div(`flex-1 overflow-y-auto`)를 `flex flex-col overflow-hidden`으로 변경하여 `PanelItemForm`이 `h-full`을 올바르게 차지하도록 조정, `components/Panel/ItemPanel.tsx`
- [x] T012 [US2] `ItemPanel`에 Visual Viewport API `useEffect` 추가 — `isOpen` 시 `visualViewport` `resize`/`scroll` 이벤트 구독, `keyboardHeight = window.innerHeight - vv.height - vv.offsetTop` 계산, 패널 div에 `style={{ bottom: \`\${keyboardHeight}px\` }}` 동적 적용, `components/Panel/ItemPanel.tsx`

**Checkpoint**: US2 완료 — DevTools 모바일 에뮬레이션에서 가상 키보드 시뮬레이션 후 버튼 접근성 확인

---

## Phase 4: User Story 3 - 링크 편집 레이아웃 개선 (Priority: P3)

**Goal**: 링크 입력 필드를 모바일에서 1단 세로 레이아웃으로 변경하여 좁은 화면에서도 편하게 입력할 수 있다.

**Independent Test**: 편집 모드에서 링크 추가 후 375px 뷰포트로 확인 → 라벨 필드와 URL 필드가 세로로 쌓여 각각 전체 너비로 표시되어야 함.

### Implementation for User Story 3

- [x] T013 [P] [US3] `PanelItemForm` 링크 섹션의 내부 grid를 `grid-cols-1 md:grid-cols-2 gap-2`로 변경, `components/Panel/PanelItemForm.tsx`

**Checkpoint**: US3 완료 — 모바일 뷰포트에서 링크 입력 레이아웃 확인

---

## Phase 5: User Story 4 - 편집 모드 진입 시 포커스 관리 (Priority: P4)

**Goal**: 편집 버튼 탭 후 이름 입력 필드에 자동 포커스가 이동하여 추가 탭 없이 바로 입력 시작 가능.

**Independent Test**: 상세 뷰에서 "편집" 버튼 탭 → 이름 입력 필드에 커서가 위치해야 함 (iOS Safari에서는 키보드가 자동으로 올라오지 않을 수 있으나 커서는 있어야 함).

### Implementation for User Story 4

- [x] T014 [P] [US4] `PanelItemForm`의 이름 `<input>`에 `autoFocus` 속성 추가, `components/Panel/PanelItemForm.tsx`

**Checkpoint**: US4 완료 — 편집 버튼 탭 후 커서 위치 확인

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 전체 통합 검증 및 시각적 일관성 점검

- [x] T015 quickstart.md의 수동 테스트 시나리오 전체 실행 — 375px 뷰포트 기준 5개 동작(열기·상세보기·편집·저장·취소·삭제) 검증
- [x] T016 [P] 인라인 확인 UI(T008) 및 헤더 삭제 버튼(T007)의 시각적 스타일 점검 — 기존 디자인 언어(gray-900, red-500, rounded-lg 등)와 일관성 확인, `components/Panel/ItemPanel.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **US1 (Phase 2)**: Phase 1 완료 후 시작 — T004/T005는 T001/T002 각각 의존
- **US2 (Phase 3)**: Phase 1 완료 후 시작 (US1과 병렬 가능, 단 동일 파일 편집 주의)
- **US3 (Phase 4)**: Phase 1 완료 후 시작 (US1/US2와 병렬 가능)
- **US4 (Phase 5)**: Phase 1 완료 후 시작 (독립적)
- **Polish (Phase 6)**: 원하는 유저 스토리 완료 후

### User Story Dependencies

- **US1 (P1)**: T001, T002, T003 완료 필요
- **US2 (P2)**: T001, T002 완료 필요 (US1와 독립적으로 테스트 가능)
- **US3 (P3)**: T001 완료 필요 (단일 라인 변경)
- **US4 (P4)**: T001 완료 필요 (단일 라인 변경)

### Within User Story 1

```
T001 [P] ──┐
           ├──→ T004 ──→ T008 (dirty 계산 선행)
T002 [P] ──┤
           ├──→ T005 ──→ T006 ──→ T008 ──→ T009
           └──→ (T002 기반)

T003 ─────────→ T007 (삭제 버튼 헤더 이전 선행)
```

### Parallel Opportunities

- T001 + T002: 다른 파일 → 완전 병렬
- T004 + T005: 다른 파일 → 완전 병렬 (Phase 1 완료 후)
- T013 + T014: 다른 prop/섹션 → 병렬 가능
- US3(T013) + US4(T014): 서로 독립 → 병렬 가능

---

## Parallel Example: User Story 1

```
# Phase 1 병렬 실행:
Task T001: PanelItemForm props 인터페이스 변경
Task T002: ItemPanel 상태 추가

# Phase 2 (Phase 1 후) 병렬 시작 가능:
Task T004: PanelItemForm dirty 계산 로직 (PanelItemForm.tsx)
Task T005: ItemPanel close 핸들러 수정 (ItemPanel.tsx)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 완료 (T001-T003)
2. Phase 2 완료 (T004-T009)
3. **STOP and VALIDATE**: 편집 중 닫기 시나리오 전체 검증
4. 데이터 손실 없음 확인 → 배포 가능

### Incremental Delivery

1. Phase 1 (Foundational) → 인터페이스 안정화
2. US1 (P1) → 데이터 손실 방지 → 검증 → 배포
3. US2 (P2) → sticky footer + 키보드 처리 → 검증 → 배포
4. US3+US4 (P3/P4) → 나머지 UX 개선 → 검증 → 배포
5. Polish → 최종 마무리

### Solo Developer Strategy (권장)

단일 개발자 기준 순서:
1. T001 → T002 (빠른 병렬 또는 순차) → T003
2. T004 → T005 → T006 → T007 → T008 → T009 (US1 완료)
3. T010 → T011 → T012 (US2 완료)
4. T013 → T014 (US3/US4, 빠른 작업)
5. T015 → T016 (검증)

---

## Notes

- [P] 태스크 = 다른 파일 또는 독립적 함수 → 병렬 실행 가능
- T003(삭제 로직 이전)은 ItemPanel + PanelItemForm 두 파일 모두 수정 필요
- Visual Viewport API(T012)는 `useEffect` 내부에서만 `window.visualViewport` 참조 (SSR 안전)
- `confirmingClose` 상태 활성화 중 페이지 이동 등으로 패널이 강제 닫히면 `isDirty` 초기화 필요 (T003에서 고려)
- `autoFocus`(T014)는 iOS Safari에서 키보드를 자동으로 올리지 않을 수 있으나 허용된 동작
