# Research: 모바일 패널 UX 개선

**Phase 0 Output** | Branch: `004-mobile-panel-ux`

---

## 1. 가상 키보드 + Sticky Footer 처리

### Decision
Visual Viewport API를 사용하여 키보드가 올라왔을 때 패널의 `bottom` 오프셋을 동적으로 조정한다.

### Rationale
- `dvh` (dynamic viewport height)는 iOS Safari에서 가상 키보드 변화에 반응하지 않는다. iOS는 레이아웃 뷰포트를 키보드 등장 시 리사이즈하지 않음.
- Visual Viewport API (`window.visualViewport`)는 iOS Safari 13+, Android Chrome 108+에서 지원되며 실제 눈에 보이는 뷰포트 크기를 제공한다.
- `window.innerHeight - window.visualViewport.height`로 키보드 높이를 계산하여 패널의 `bottom` 값을 동적으로 설정하면, 패널이 키보드 위에 떠 있는 효과를 얻는다.

### Alternatives Considered
- `dvh` CSS 단위 — iOS에서 키보드 미대응으로 부적합
- `env(keyboard-inset-height)` CSS — Chromium 94+ 전용, Safari 미지원
- `interactive-widget=resizes-content` 메타태그 — Chromium 전용
- 키보드 높이 무시 (스크롤로 해결) — SC-002 요구사항 미충족

### Implementation Note
```
keyboardHeight = window.innerHeight - window.visualViewport.height
panel.style.bottom = `${keyboardHeight}px`
```
`visualViewport` 이벤트: `resize` + `scroll`

---

## 2. Dirty State 감지

### Decision
폼 상태(`FormData`)와 원래 아이템(`TripItem`) 값을 비교하는 `isDirty` 계산 함수를 사용한다. 링크 비교 시 URL이 비어있는 항목은 제외한다.

### Rationale
- React 폼 상태는 이미 `useState<FormData>`로 관리되고 있어, 매 렌더마다 원래 값과 얕은 비교가 가능하다.
- 링크 배열의 경우 `filter(l => l.url.trim())` 후 JSON.stringify 비교를 사용하면 빈 행 추가를 dirty로 잘못 감지하는 문제를 방지한다.
- JSON.stringify 비교는 순서 변경에도 민감하지만, 링크 순서 변경은 실질적 변경이므로 acceptable.

### Alternatives Considered
- 각 필드 개별 비교 — 코드가 길어지지만 더 정확. 이 규모에서는 JSON.stringify로 충분.
- useRef로 초기값 스냅샷 유지 — `useState`로도 충분하므로 불필요.

---

## 3. 인라인 확인 UI 패턴

### Decision
`confirmingClose` 상태가 true일 때, 패널의 sticky footer 영역을 "저장/취소 버튼"에서 "나가기/계속 편집 버튼"으로 교체하여 렌더링한다.

### Rationale
- 별도 오버레이/모달 레이어 없이 기존 footer 영역을 재사용하므로 구현이 단순하다.
- 사용자 시선이 이미 footer 영역에 있어 직관적이다.
- 네이티브 `confirm()` 팝업 대비 스타일 통일 및 애니메이션 적용 가능.

### Alternatives Considered
- 패널 전체를 반투명 오버레이로 덮는 형태 — 구현 복잡도 증가, 불필요
- 헤더 영역에 확인 메시지 표시 — footer 버튼과 분리되어 UX가 어색함

---

## 4. 컴포넌트 구조 변경

### Decision
`PanelItemForm`은 dirty 상태를 내부에서 계산하고 `onDirtyChange` 콜백으로 부모(`ItemPanel`)에 전달한다. 삭제 버튼은 `ItemPanel`의 헤더로 이동하고, `PanelItemForm`은 `onDelete` prop을 제거한다.

### Rationale
- Dirty 상태 계산은 form 데이터와 원래 item 모두 접근 가능한 `PanelItemForm`에서 담당하는 것이 자연스럽다.
- 삭제 버튼을 헤더로 이동하면 `PanelItemForm`의 sticky footer는 저장/취소만 담당하여 레이아웃이 단순해진다.
- `ItemPanel`이 `isDirty`를 보유하면 close 시도 시 확인 여부를 결정하는 로직을 중앙 집중화할 수 있다.

### Alternatives Considered
- `useImperativeHandle`로 dirty 상태 노출 — 불필요한 복잡도
- `ItemPanel`에서 직접 dirty 계산 — form 데이터에 접근 불가능하여 적합하지 않음

---

## 5. Auto-focus

### Decision
`PanelItemForm`의 이름 입력 필드에 `autoFocus` 속성을 추가하고, iOS Safari 제약을 고려하여 `useEffect`에서 `.focus()` 호출도 병행한다.

### Rationale
- `autoFocus`는 표준 HTML 속성으로 대부분의 브라우저에서 동작한다.
- iOS Safari는 사용자 제스처(탭) 없이 프로그래매틱 키보드 표시를 차단하므로, 편집 모드 전환이 실제 탭 이벤트의 결과이면 `autoFocus`가 동작할 가능성이 높다.
- 커서 위치만 설정되고 키보드가 자동으로 올라오지 않는 케이스도 있으나, SC-004 요구사항("추가 탭 없이 바로 텍스트 입력 가능")을 최대한 충족한다.

---

## 6. 링크 레이아웃

### Decision
링크 입력 그룹의 2단 그리드(`grid grid-cols-2`)를 Tailwind의 반응형 클래스로 모바일(`< md`)에서는 1단, 데스크탑에서는 2단으로 변경한다.

### Rationale
- 현재 코드는 모바일/데스크탑 구분 없이 `grid-cols-2`를 사용 중. Tailwind의 `md:grid-cols-2` 패턴으로 최소한의 변경으로 해결 가능.
- 데스크탑 사이드 패널(520px)에서는 2단 그리드가 여전히 적합하므로 유지.
