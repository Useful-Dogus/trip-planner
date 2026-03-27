# Tasks: 데이터 캐싱 및 빠른 UX 전략

**Input**: Design documents from `/specs/005-data-caching-fast-ux/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: User story 순으로 구성. 각 스토리는 독립적으로 구현·테스트 가능.
**Tests**: 별도 요청 없음 - 테스트 태스크 미포함.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 완료 의존성 없음)
- **[Story]**: 담당 유저 스토리 레이블 (US1-US5)

---

## Phase 1: Setup

**Purpose**: SWR 패키지 설치 및 디렉토리 구조 생성

- [x] T001 `npm install swr` 실행하여 SWR 패키지 설치
- [x] T002 [P] `lib/providers/` 디렉토리 생성 (SWRProvider 파일 위치)
- [x] T003 [P] `lib/hooks/` 디렉토리 생성 (useItems 훅 파일 위치) — 이미 존재하면 생략

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 유저 스토리가 공유하는 핵심 인프라. 이 Phase 완료 전에는 어떤 스토리도 시작 불가.

**⚠️ CRITICAL**: Phase 3 이상 작업은 이 Phase 완료 후 시작

- [x] T004 `lib/providers/SWRProvider.tsx` 생성: localStorage 기반 영속 캐시 provider 구현 (`localStorageProvider` 함수 포함, 키는 `trip-planner-cache`), `focusThrottleInterval: 30_000`, `revalidateOnFocus: true`, `revalidateOnReconnect: true`, `dedupingInterval: 5_000`, `shouldRetryOnError: false` 설정
- [x] T005 [P] `components/UI/Toast.tsx` 생성: 하단 중앙 위치, 4초 자동 소멸, `type: 'error' | 'success' | 'info'`, `action?: { label, onClick }` 재시도 버튼 지원, 최대 3개 스택. `showToast()` 함수를 전역 접근 가능하게 노출 (예: Context 또는 이벤트 버스 패턴)
- [x] T006 `app/layout.tsx` 수정: `SWRProvider`로 children 감싸기 (`'use client'` 분리 파일 필요 시 `app/providers.tsx` 생성 후 import)

**Checkpoint**: SWRProvider가 layout에 적용되고 Toast 컴포넌트가 렌더링 가능한 상태

---

## Phase 3: User Story 1 - 탭 전환 시 즉시 표시 (Priority: P1) 🎯 MVP

**Goal**: 최초 로드 이후 탭 전환 시 스켈레톤 없이 즉시 아이템 표시. stale-while-revalidate로 백그라운드 갱신.

**Independent Test**: 앱 로드 후 탭을 3회 전환. 첫 로드 이후 스켈레톤이 보이지 않으면 통과.

- [x] T007 [US1] `lib/hooks/useItems.ts` 생성: `useSWR('/api/items', fetcher)` 기반, `isLoading`(캐시 없을 때만 true), `isValidating`(백그라운드 갱신 중), `syncStatus: SyncStatus`, `items: TripItem[]`, `error: Error | null` 반환. fetcher는 `/api/items` GET 요청, `data.items ?? []` 추출
- [x] T008 [P] [US1] `app/research/page.tsx` 마이그레이션: `useEffect + fetch + useState` 패턴을 `const { items, isLoading } = useItems()`로 교체. 로딩 스켈레톤 조건을 `isLoading`으로 변경
- [x] T009 [P] [US1] `app/schedule/page.tsx` 마이그레이션: 동일하게 `useEffect + fetch + useState` → `useItems()` 교체

**Checkpoint**: 탭 전환 시 스켈레톤 재표시 없이 즉시 데이터 렌더링 확인

---

## Phase 4: User Story 2 - 아이템 수정·삭제 즉시 반영 (Priority: P1)

**Goal**: 저장/삭제 버튼 클릭 즉시 UI 반영. 서버 실패 시 자동 롤백 + Toast 알림.

**Independent Test**: 아이템 이름 수정 후 저장 클릭 즉시 목록에 반영되면 통과. 서버 오류 시 원복되면 통과.

- [x] T010 [US2] `lib/hooks/useItems.ts`에 `updateItem(id, changes)` 추가: 현재 items 스냅샷 저장 → `mutate(optimisticData, { revalidate: false })` → `PUT /api/items/:id` 요청 → 성공 시 `mutate()` 재검증, 실패 시 스냅샷으로 롤백 + `showToast({ type: 'error', message: '저장 실패', action: { label: '재시도', onClick: ... } })`
- [x] T011 [US2] `lib/hooks/useItems.ts`에 `deleteItem(id)` 추가: 동일 낙관적 패턴 적용. `DELETE /api/items/:id` 요청. 실패 시 롤백 + Toast
- [x] T012 [US2] `components/Panel/PanelItemForm.tsx` 수정: 수정 저장 로직(`PUT fetch`)을 `updateItem()` 호출로 교체. 저장 후 `onClose()` 즉시 호출 (낙관적 반영 완료이므로 응답 대기 불필요)
- [x] T013 [US2] `components/Panel/PanelItemForm.tsx` 수정: 삭제 로직(`DELETE fetch`)을 `deleteItem()` 호출로 교체. 동일하게 `onClose()` 즉시 호출

**Checkpoint**: 저장·삭제 클릭 즉시 목록 반영, 서버 오류 시 롤백·Toast 확인

---

## Phase 5: User Story 3 - 신규 아이템 추가 즉시 목록 반영 (Priority: P2)

**Goal**: 아이템 추가 시 임시 ID로 즉시 목록 표시. 서버 성공 시 ID 교체, 실패 시 제거.

**Independent Test**: 새 아이템 저장 직후 목록에 나타나면 통과.

- [x] T014 [US3] `lib/hooks/useItems.ts`에 `createItem(item)` 추가: `tmp_${Date.now()}` 임시 ID로 목록에 즉시 추가 → `POST /api/items` 요청 → 성공 시 서버 응답 ID로 교체(`mutate()`), 실패 시 임시 아이템 제거 + Toast
- [x] T015 [US3] `components/Panel/PanelItemForm.tsx` 수정: 신규 아이템 저장 로직(`POST fetch`)을 `createItem()` 호출로 교체. 저장 후 `onClose()` 즉시 호출

**Checkpoint**: 새 아이템이 저장 버튼 클릭 즉시 목록에 표시됨 확인

---

## Phase 6: User Story 4 - 빠른 상태 토글 (Priority: P2)

**Goal**: 카드에서 패널 열지 않고 상태 뱃지 클릭으로 바로 상태 변경.

**Independent Test**: 카드 상태 뱃지 클릭 → 드롭다운 표시 → 상태 선택 → 카드 뱃지 즉시 변경되면 통과.

- [x] T016 [US4] `lib/hooks/useItems.ts`에 `updateStatus(id, status)` 추가: `updateItem(id, { status })`의 래퍼
- [x] T017 [US4] `components/Items/StatusDropdown.tsx` 생성: 상태 뱃지 클릭 시 팝오버 표시, 전체 상태 목록(검토중/보류/대기중/확정/탈락) 렌더링, 외부 클릭 시 닫힘(`useRef` + `useEffect`), ESC 키 닫힘. 선택 시 `onSelect(status)` 콜백 호출
- [x] T018 [US4] ItemCard 컴포넌트 수정: 상태 뱃지를 `StatusDropdown`으로 교체, `onSelect` → `updateStatus(item.id, status)` 연결. ItemCard 위치는 `components/Items/` 또는 현재 프로젝트 실제 경로 확인 후 적용

**Checkpoint**: 카드에서 패널 없이 상태 변경 가능, 낙관적 업데이트 동작 확인

---

## Phase 7: User Story 5 - 오프라인/네트워크 불안정 대응 (Priority: P3)

**Goal**: 오프라인 시 캐시 데이터 탐색 가능, 재연결 시 자동 갱신.

**Independent Test**: 네트워크 끊은 후 탭 전환 → 캐시 데이터 표시되면 통과.

- [x] T019 [US5] `lib/providers/SWRProvider.tsx` 검증: `revalidateOnReconnect: true` 확인 (T004에서 이미 설정되었어야 함)
- [x] T020 [US5] `lib/hooks/useItems.ts` 수정: 쓰기 연산(`updateItem`, `deleteItem`, `createItem`) 상단에 `navigator.onLine` 체크 추가. 오프라인 시 `showToast({ type: 'info', message: '오프라인 상태입니다. 인터넷 연결 후 다시 시도해주세요.' })` 후 early return
- [x] T021 [P] [US5] `components/UI/OfflineBanner.tsx` 생성: `navigator.onLine` 및 `online`/`offline` 이벤트 구독으로 오프라인 상태 감지, 화면 상단 고정 배너 표시 (SC-006 "오프라인 표시" 요구사항). `app/layout.tsx`에 추가

**Checkpoint**: 오프라인 시 배너 표시, 쓰기 차단, 재연결 시 자동 갱신 확인

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 캐시 만료 처리, 코드 정리, 최종 검증

- [x] T022 `lib/providers/SWRProvider.tsx` 수정: localStorage 읽기 시 `cachedAt` 타임스탬프 확인 → 24시간(86,400,000ms) 초과 시 해당 캐시 엔트리 무효화 처리 (만료된 데이터 제거 후 서버 요청)
- [x] T023 [P] `lib/hooks/useItems.ts`에서 `syncStatus` 계산 완성: `isLoading`/`isValidating`/`error`/오프라인 상태를 `SyncStatus` enum(`fresh | stale | offline | error`)으로 변환 후 반환
- [ ] T024 quickstart.md 체크리스트 7개 항목 수동 검증 실행

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Phase 1 완료 후 → 모든 유저 스토리를 **블록**
- **US1 (Phase 3)**: Phase 2 완료 후 시작 → 다른 스토리와 무관, 독립 실행 가능
- **US2 (Phase 4)**: Phase 3 완료 후 시작 (useItems.ts 기본 구조 필요)
- **US3 (Phase 5)**: Phase 3 완료 후 시작 (useItems.ts 기본 구조 필요). US2와 병렬 가능
- **US4 (Phase 6)**: Phase 3 완료 후 시작. US2/US3와 병렬 가능 (다른 파일)
- **US5 (Phase 7)**: Phase 2 완료 후 시작. 독립적
- **Polish (Phase 8)**: 원하는 스토리 완료 후

### User Story Dependencies (within useItems.ts)

- `useItems.ts` 파일 내 함수 추가 순서: 기본 fetch(T007) → updateItem(T010) → deleteItem(T011) → createItem(T014) → updateStatus(T016)
- 각 쓰기 함수는 독립적이므로 T010, T011은 병렬 작업 가능

### Parallel Opportunities

- T002, T003: 병렬 실행 가능
- T004, T005: 병렬 실행 가능 (다른 파일)
- T008, T009: 병렬 실행 가능 (T007 완료 후, 다른 파일)
- T010, T011: 같은 파일이지만 함수 단위이므로 순차 추천
- T012, T013: T010/T011 완료 후 병렬 가능 (같은 파일, 다른 로직 섹션)
- T019, T021: 병렬 실행 가능

---

## Parallel Example: Phase 3 (US1)

```
# T007 완료 후 T008, T009를 동시에 실행:
Task A: "app/research/page.tsx에서 useItems로 교체"
Task B: "app/schedule/page.tsx에서 useItems로 교체"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Phase 1: Setup
2. Phase 2: Foundational (SWRProvider + Toast + layout)
3. Phase 3: US1 (탭 전환 즉시 표시) — **가장 체감 효과 큰 변화**
4. Phase 4: US2 (수정·삭제 즉시 반영)
5. **STOP and VALIDATE**: 핵심 워크플로우 테스트
6. 필요 시 배포/데모

### Incremental Delivery

1. Setup + Foundational → 인프라 준비
2. US1 → 탭 전환 스켈레톤 제거 (빠른 체감 개선)
3. US2 → 수정 즉시 반영 (핵심 워크플로우)
4. US3 → 추가 즉시 반영
5. US4 → 빠른 상태 토글 (효율 향상)
6. US5 → 오프라인 대응 (견고성)
7. Polish → TTL, syncStatus, 최종 검증

---

## Notes

- `[P]` 태스크 = 다른 파일, 의존성 없음 → 병렬 실행 가능
- `[Story]` 레이블로 스토리별 진행 상황 추적
- `useItems.ts`는 단계적으로 확장됨 (T007 → T010/T011 → T014 → T016/T023)
- ItemCard 실제 파일 경로는 T018 작업 전 프로젝트에서 확인 필요
- 각 Phase 완료 후 해당 스토리의 **Independent Test** 기준으로 수동 검증 권장
