# 012 — 구현 태스크

## T1. app/schedule/page.tsx — 신규 페이지 생성

- `useItems()`에서 `items`, `updateItem`, `createItem` 추출
- `<ScheduleTable>` 렌더링
- `<ItemPanel>` 연동 (selectedItemId state)

## T2. components/Layout/Navigation.tsx — "일정" 탭 추가

- `/schedule` 링크 추가
- 기존 탭 순서: 리서치 → 일정 → 지도

## T3. components/Schedule/cells/ — 셀 컴포넌트 5종 구현

각 셀은 `isEditing`, `value`, `onChange`, `onBlur`, `onKeyDown` props를 받는 단순 표현 컴포넌트.

- `TimeCell.tsx`: 텍스트 입력, `HH:MM` 포맷 검증 (blur 시 잘못된 포맷이면 이전 값 복원)
- `NameCell.tsx`: 텍스트 입력, 빈값 blur 시 이전 값 복원
- `CategoryCell.tsx`: 이모지 그리드 팝오버, 선택 즉시 닫힘 + 다음 셀 이동 콜백
- `StatusCell.tsx`: 컬러 도트 + 라벨 팝오버 (4개 옵션), 선택 즉시 닫힘 + 다음 셀 이동 콜백
- `BudgetCell.tsx`: 숫자 입력, 표시 시 통화 포맷 (`¥` 또는 `₩` 등)

## T4. components/Schedule/TableRow.tsx — 행 컴포넌트 구현

- `localValues` state: 편집 중 임시 값 관리 (item prop과 분리)
- `item` prop 변경 시 `localValues` 동기화 (서버 revalidation 반영)
- `debouncedUpdate` 생성 (500ms, `onCellChange` 래핑)
- blur 시 해당 셀 flush
- 행에서 포커스 완전히 벗어날 때(`onRowBlur`) flush
- Tab / Enter / Escape 키보드 핸들러
- `···` 버튼 클릭 → `onOpenPanel(item.id)` 호출
- 모바일: 2줄 레이아웃 (카테고리+이름+상태 / 시간+예산)

## T5. components/Schedule/DateGroupHeader.tsx — 날짜 그룹 헤더 구현

- 날짜 포맷: `4월 20일 (일)` (한국어 포맷)
- D+숫자 표시: 여행 첫날 기준 경과일
- 합계 예산: 해당 그룹 `budget` 합산 (예산 없는 항목 제외)
- 접기/펼치기 토글 (`isCollapsed` prop)
- `+ 추가` 버튼

## T6. components/Schedule/ScheduleTable.tsx — 메인 테이블 컴포넌트 구현

- `dateGroups` useMemo: 날짜별 그룹 계산 (날짜 없음 → `'__undated__'`)
- `tripStartDate` useMemo: 가장 이른 날짜 계산 (D+ 기준)
- `editingCell` state: `{ itemId, field } | null`
- `collapsedDates` state: 접힌 날짜 집합 (`Set<string>`)
- `pendingRows` state: 생성 중 고스트 행 관리
- `selectedItemId` state: ItemPanel 연동
- 키보드 내비게이션 핸들러 (Tab, Enter, Escape, ↑↓)
  - `data-item-id` + `data-field` 기반 다음 포커스 셀 계산
- 고스트 행: 각 그룹 하단, 클릭 시 새 항목 생성 시작
- `createItem` 호출 타이밍: 이름 blur 또는 Enter 시 (값 있을 때만)
- `beforeunload` 핸들러: pending debounce flush
- "날짜 미정" 그룹: 날짜 없는 항목 하단에 별도 표시

## T7. 빈 상태 처리

- 전체 항목 없음: "아직 등록된 항목이 없어요. 리서치 탭에서 장소를 추가해보세요." 안내
- 날짜 없는 항목만 있음: "날짜 미정" 그룹만 표시
- 날짜 있는 항목 없음: "날짜 미정" 그룹 아래 빈 날짜 그룹들
