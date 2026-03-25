# Research: 패널 기반 편집 UX

**Branch**: `003-panel-editing-ux` | **Date**: 2026-03-25

## 결정 사항

### 1. 패널 상태 관리 방식

**Decision**: ResearchPage의 로컬 `useState`로 `selectedItemId: string | null` 관리. Context/Zustand 불필요.

**Rationale**: ResearchPage가 이미 items 배열을 갖고 있으며, 패널은 research 페이지 전용 UI다. 전역 상태 추가 없이 prop drilling으로 충분히 처리 가능한 2-depth 구조(Page → ItemList → ItemCard).

**Alternatives considered**: URL 쿼리 파라미터(`?item=id`) — 뒤로가기/북마크 지원 장점이 있으나 패널이 닫힐 때마다 URL이 변경되어 UX 잡음이 발생. 이번 범위에서는 세션 내 임시 상태로 결정.

---

### 2. 패널 반응형 구현 방식

**Decision**: 단일 `ItemPanel` 컴포넌트 내에서 Tailwind 반응형 클래스로 분기. 데스크탑(md+)에서 사이드 패널, 모바일에서 바텀 시트.

**Rationale**: Next.js + Tailwind 스택에 자연스러우며, JavaScript로 viewport를 감지해 분기하는 것보다 CSS transition이 더 안정적이고 SSR-friendly함.

**Implementation**:
- `fixed right-0 top-0 h-full w-96` (데스크탑 사이드 패널)
- `fixed bottom-0 left-0 right-0 rounded-t-2xl max-h-[85vh]` (모바일 바텀 시트)
- `transform translate-x-full` / `translate-y-full` → `translate-x-0` / `translate-y-0` CSS transition

---

### 3. 편집 폼 패널 내 통합 방식

**Decision**: 기존 `ItemForm` 컴포넌트를 직접 재사용하지 않고, 패널 전용 `PanelItemForm` 컴포넌트를 만들어 `onSave(updatedItem)` / `onDelete()` 콜백으로 동작하게 수정.

**Rationale**: 기존 `ItemForm`은 저장 성공 시 `router.push()`로 페이지를 이동하도록 설계됨. 패널 내에서는 페이지 이동 없이 콜백을 통해 부모(ResearchPage) items 상태를 갱신해야 함. 기존 컴포넌트를 수정하면 기존 `/items/[id]/edit` 페이지가 깨질 수 있으므로 분리.

**Alternatives considered**: ItemForm에 `onSuccess` prop 추가하여 router.push vs 콜백 분기 — 단순하지만 기존 edit page와의 결합이 생겨 향후 유지보수 복잡도 증가. 패널 전용 컴포넌트 분리가 더 명확한 책임 분리.

---

### 4. 실시간 리스트 갱신 방식

**Decision**: 저장 성공 시 API 응답에서 반환된 `updatedItem`으로 ResearchPage의 `items` 상태를 직접 업데이트 (`setItems` immer-style 교체).

**Rationale**: `router.refresh()`는 서버 컴포넌트 재렌더링을 트리거하지만 ResearchPage는 클라이언트 컴포넌트이므로 효과가 없음. 클라이언트 상태를 직접 업데이트하는 것이 가장 빠르고 심플함.

---

### 5. 스와이프 제스처 구현

**Decision**: 네이티브 `touchstart`/`touchmove`/`touchend` 이벤트를 이용한 직접 구현. 외부 라이브러리 불필요.

**Rationale**: 아래로 50px 이상 스와이프 시 닫힘. `useRef`로 터치 시작 Y 좌표 기록, `touchend`에서 delta 계산. 간단한 동작이므로 라이브러리 의존성 추가 불필요.

---

### 6. 오버레이(Backdrop) 처리

**Decision**: 반투명 검정 오버레이를 패널 뒤에 렌더링. 모바일: 항상 표시, 데스크탑: 표시 (사이드 패널이 리스트를 덮지 않는 레이아웃이지만 포커스 명확화를 위해).

**Rationale**: 패널 외부 클릭으로 닫기 기능 구현에 필요. 리스트와 패널이 나란히 보이는 데스크탑에서도 패널 포커스 명확화에 도움.

