# Tasks: 아이템 메타데이터 UX 재설계

**Input**: Design documents from `/specs/007-item-metadata-ux/`
**Prerequisites**: plan.md ✓, spec.md ✓

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 새 메타데이터 체계 정의와 문서 기반 마련

- [ ] T001 `specs/007-item-metadata-ux/plan.md`, `specs/007-item-metadata-ux/tasks.md` 작성 및 구현 범위 고정
- [ ] T002 [P] `lib/itemOptions.ts` 공통 옵션/라벨/스타일 정의 파일 추가

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 스토리가 의존하는 데이터 모델과 CRUD 계층 정리

**⚠️ CRITICAL**: 이 단계 완료 전 UI 구현 착수 금지

- [ ] T003 `types/index.ts`에 새 `Category`, `Status`, `ReservationStatus`, `Priority` 타입 및 `TripItem.reservation_status` 추가
- [ ] T004 [P] `supabase/schema.sql`에 `reservation_status` 컬럼 추가 및 새 값 체계 주석 반영
- [ ] T005 `lib/data.ts`에 새 값 체계 읽기/쓰기 및 구값 마이그레이션 로직 추가
- [ ] T006 `app/api/items/route.ts`와 `app/api/items/[id]/route.ts`의 허용값 검증과 nullable 처리 갱신
- [ ] T007 `lib/hooks/useItems.ts`에서 nullable 메타데이터 필드 optimistic update 처리 정리

**Checkpoint**: 저장소, 타입, API가 새 체계를 이해한다

---

## Phase 3: User Story 1 - 항목의 메타데이터를 즉시 파악하기 (Priority: P1) 🎯 MVP

**Goal**: 목록 카드와 상세 패널에서 4개 메타데이터를 모두 칩으로 안정적으로 읽을 수 있다.

**Independent Test**: 값 있는 항목과 값 없는 항목을 각각 열어 4개 칩과 placeholder 칩이 모두 표시되는지 확인한다.

### Implementation for User Story 1

- [ ] T008 [US1] `components/UI/StatusBadge.tsx`, `components/UI/PriorityBadge.tsx`를 공통 옵션 메타데이터 기반으로 전환
- [ ] T009 [P] [US1] `components/Items/ItemCard.tsx`에서 카테고리/상태/예약상태/우선순위 4개 칩 항상 표시 및 wrap 레이아웃 적용
- [ ] T010 [US1] `components/Panel/ItemPanel.tsx` 상세 보기 영역에 4개 칩 전체 노출 및 placeholder 칩 적용
- [ ] T011 [US1] `components/Items/ItemList.tsx` 필터/정렬/라벨을 새 체계로 갱신

**Checkpoint**: 읽기 전용 상태에서 4개 메타데이터가 일관되게 보인다

---

## Phase 4: User Story 2 - 칩 클릭으로 빠르게 수정하기 (Priority: P1)

**Goal**: 상세 패널에서 4개 칩 모두 드롭다운으로 즉시 수정 가능하다.

**Independent Test**: 상세 패널에서 4개 칩 각각을 클릭해 드롭다운으로 값을 변경하고 즉시 저장되는지 확인한다.

### Implementation for User Story 2

- [ ] T012 [US2] `components/Panel/ItemPanel.tsx`에 범용 메타데이터 칩 드롭다운 패턴 추가
- [ ] T013 [P] [US2] 기존 `components/Items/StatusDropdown.tsx`를 공통 패턴으로 재사용하거나 제거
- [ ] T014 [US2] `lib/hooks/useItems.ts`와 상세 패널 저장 흐름을 연결해 즉시 저장/복원 UX 보강

**Checkpoint**: 상세 패널에서 전체 편집 폼 진입 없이 메타데이터 수정 가능

---

## Phase 5: User Story 3 - 새 분류 체계로 생성/편집하기 (Priority: P2)

**Goal**: 생성 폼과 전체 편집 폼이 새 메타데이터 체계를 사용한다.

**Independent Test**: 새 항목 생성과 기존 항목 편집에서 4개 필드 입력 후 저장 시 카드/패널과 일치하는지 확인한다.

### Implementation for User Story 3

- [ ] T015 [US3] `components/Items/ItemForm.tsx`를 새 카테고리/상태/예약상태/우선순위 체계로 갱신
- [ ] T016 [US3] `components/Panel/PanelItemForm.tsx`를 새 체계로 갱신
- [ ] T017 [P] [US3] 기본값, placeholder, 설명 라벨을 폼과 카드/패널 간 일관화

**Checkpoint**: 입력 채널 전체가 새 체계를 사용한다

---

## Phase 6: User Story 4 - 예약상태와 마이그레이션 처리 (Priority: P2)

**Goal**: 기존 데이터가 새 체계로 안전하게 흡수되고 `reservation_status`가 별도 관리된다.

**Independent Test**: 구값 데이터 샘플을 읽었을 때 새 체계로 변환되고, `reservation_status` 없는 항목은 placeholder 칩으로 표시되는지 확인한다.

### Implementation for User Story 4

- [ ] T018 [US4] `lib/data.ts` 또는 별도 유틸에 category/status/priority 마이그레이션 규칙 구현
- [ ] T019 [P] [US4] Supabase row ↔ `TripItem` 매핑에 `reservation_status` 추가
- [ ] T020 [US4] 구값이 남은 데이터에 대한 마이그레이션 적용 경로와 후처리 검증 추가

**Checkpoint**: 기존 데이터와 신규 데이터가 한 체계로 동작한다

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 최종 검증 및 위험 정리

- [ ] T021 `npm run lint` 실행
- [ ] T022 `npm run build` 실행
- [ ] T023 모바일 기준 수동 확인: 목록 카드 wrap, 상세 패널 칩 드롭다운, placeholder 노출

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: 즉시 시작 가능
- **Phase 2**: 모든 UI 변경의 선행 조건
- **Phase 3-4**: Phase 2 완료 후 시작
- **Phase 5-6**: Phase 2 완료 후, Phase 3-4와 일부 병행 가능
- **Phase 7**: 전체 구현 완료 후

### Parallel Opportunities

```bash
T004 supabase/schema.sql
T008 UI badge 공통화
T017 라벨/설명 정리
T019 row 매핑 정리
```

## Implementation Strategy

### MVP First

1. 타입/API/저장소 체계부터 새 규격으로 전환
2. 목록 카드와 상세 패널의 4개 칩 표시 구현
3. 상세 패널 클릭 편집 구현
4. 생성/편집 폼 반영
5. 마이그레이션 및 검증 마무리

## Notes

- 현재 저장소에는 자동 테스트가 없으므로 lint/build와 수동 UX 검증이 품질 게이트다.
- `app/research/page.tsx`의 기존 미커밋 변경은 사용자 작업으로 간주하고 건드리지 않는다.
