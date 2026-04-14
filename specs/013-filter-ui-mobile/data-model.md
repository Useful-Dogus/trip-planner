# Data Model: 목록 뷰 필터 UI 개선

DB 변경 없음. 클라이언트 컴포넌트 인터페이스만 정의한다.

## 타입 정의 (신규)

```ts
// components/Research/FilterPanel.tsx
export interface FilterState {
  categories: Category[]
  tripPriorities: TripPriority[]
  reservationStatuses: ReservationStatus[]
  showExcluded: boolean
}

export interface FilterPanelProps {
  isOpen: boolean
  filterState: FilterState
  onChange: (next: FilterState) => void
  onClose: () => void
}
```

```ts
// components/Research/FilterButton.tsx
export interface FilterButtonProps {
  activeCount: number   // 활성 필터 합계
  onClick: () => void
}
```

```ts
// components/Research/SortButton.tsx
type SortKey = 'name' | 'date' | 'budget' | 'trip_priority'
type SortDir = 'asc' | 'desc'

export interface SortButtonProps {
  sortKey: SortKey
  sortDir: SortDir
  onChange: (key: SortKey, dir: SortDir) => void
}
```

```ts
// components/Research/ActiveFilterChips.tsx
export interface ActiveFilterChip {
  id: string          // 고유 식별자 (예: "cat-식당", "pri-확정")
  label: string       // 표시 텍스트 (예: "식당", "확정")
  onRemove: () => void
}

export interface ActiveFilterChipsProps {
  chips: ActiveFilterChip[]
}
```

## ItemList.tsx 변경 요약

- `FilterState` 타입 도입으로 `selCats`, `selTripPriorities`, `selReservationStatuses`, `showExcluded`를 하나의 객체로 묶는다.
- `sortKey`, `sortDir`는 기존 유지, SortButton에 props로 전달.
- 인라인 `<Chip>` 렌더링 블록 제거.
- `activeCount` 계산: `selCats.length + selTripPriorities.length + selReservationStatuses.length + (showExcluded ? 1 : 0)`
- `activeChips` 배열 계산: 각 활성 필터를 `ActiveFilterChip` 형태로 매핑.

## 컴포넌트 간 데이터 흐름

```
ItemList
  ├── [state] filterState, sortKey, sortDir
  ├── FilterButton (activeCount, onClick → setFilterPanelOpen)
  ├── SortButton (sortKey, sortDir, onChange)
  ├── ActiveFilterChips (chips 배열)
  ├── FilterPanel (isOpen, filterState, onChange, onClose)
  │     ├── [mobile] 바텀시트 오버레이
  │     └── [desktop] 드롭다운 패널
  └── [기존] renderEntries → ItemCard/GroupCard
```
