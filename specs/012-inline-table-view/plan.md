# 012 — 기술 설계 (plan.md)

## 아키텍처 결정

### 라우트 구조

```
app/
  schedule/
    page.tsx       ← 신규: ScheduleTable 렌더링
```

기존 `/research` 페이지는 변경 없이 유지. 네비게이션에 "일정" 탭을 추가한다.

### 데이터 흐름

```
useItems()           ← 기존 SWR 훅 재활용
  items: TripItem[]
  updateItem(id, changes)  ← 낙관적 업데이트 + PATCH 내장

ScheduleTable
  ↓ useMemo — dateGroups
  Map<date, TripItem[]>   날짜별 그룹 (날짜 없는 항목은 '미정' 그룹)

  ↓ 각 DateGroup
  DateGroupHeader + TableRow[]
```

### 인라인 편집 상태 모델

중앙 편집 상태를 `ScheduleTable`에서 관리:

```ts
type EditingCell = {
  itemId: string
  field: 'time_start' | 'name' | 'category' | 'reservation_status' | 'budget'
}

const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
```

하나의 셀만 동시에 편집 가능. TableRow는 `editingCell`을 prop으로 받아 해당 셀 활성화 여부를 판단.

### 낙관적 업데이트 전략

기존 `useItems.updateItem`이 SWR optimistic update를 이미 포함하고 있으므로 재활용.
추가로 필요한 것은 500ms **debounce**만:

```ts
// TableRow 내부
const debouncedUpdate = useMemo(
  () => debounce((id: string, changes: Partial<TripItem>) => {
    onUpdateItem(id, changes)
  }, 500),
  [onUpdateItem]
)

// 셀 값 변경 시
const handleChange = (field: keyof TripItem, value: unknown) => {
  setLocalValue(value)         // 즉시 로컬 반영
  debouncedUpdate(item.id, { [field]: value })  // 500ms 후 API
}

// 행에서 포커스 완전히 벗어날 때 (다른 행 이동)
const handleRowBlur = () => {
  debouncedUpdate.flush()      // pending 타이머 즉시 실행
}
```

`setLocalValue`는 `TableRow` 내부 로컬 state로 관리. SWR revalidation이 완료되면 서버 값으로 대체.

### 키보드 내비게이션

`data-row-index`, `data-col-index` attribute를 각 셀에 부여하고, Tab/Enter/Arrow 핸들러에서 다음 포커스 셀을 계산:

```ts
const EDITABLE_FIELDS: EditingCell['field'][] = [
  'time_start', 'name', 'category', 'reservation_status', 'budget'
]

// Tab: 같은 행 내 다음 컬럼, 마지막 컬럼이면 다음 행 첫 컬럼
// Enter: 아래 행 동일 컬럼
// Escape: 편집 취소, 셀 focus 유지
```

팝오버 셀(category, reservation_status)은 선택 즉시 `onSelect` 콜백에서 다음 셀로 포커스 이동.

### 새 항목 생성

고스트 행 클릭 시 임시 항목을 로컬 state에 추가 후 API 호출:

```ts
const [pendingRows, setPendingRows] = useState<Map<string, Partial<TripItem>>>(new Map())
```

이름이 입력된 시점(blur 또는 Enter)에 `createItem` 호출. 이전에는 임시 ID로 낙관적 렌더링.
API 응답 후 SWR revalidation이 서버 ID로 교체.

### 날짜 그룹 계산

```ts
const dateGroups = useMemo(() => {
  const groups = new Map<string, TripItem[]>()

  const sorted = [...items].sort((a, b) => {
    const da = a.date ?? '9999-12-31'
    const db = b.date ?? '9999-12-31'
    if (da !== db) return da.localeCompare(db)
    return (a.time_start ?? '').localeCompare(b.time_start ?? '')
  })

  for (const item of sorted) {
    const key = item.date ?? '__undated__'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(item)
  }

  return groups
}, [items])
```

날짜 없는 항목은 `'__undated__'` 키로 별도 그룹 ("날짜 미정") 처리.

### D+숫자 계산

```ts
const tripStartDate = useMemo(() => {
  const dates = items.map(i => i.date).filter(Boolean) as string[]
  return dates.length ? dates.sort()[0] : null
}, [items])

const getDayOffset = (date: string) =>
  tripStartDate
    ? differenceInCalendarDays(parseISO(date), parseISO(tripStartDate)) + 1
    : null
```

## 파일별 변경 계획

### `app/schedule/page.tsx` (신규)

```tsx
export default function SchedulePage() {
  const { items, updateItem, createItem } = useItems()
  return <ScheduleTable items={items} onUpdateItem={updateItem} onCreateItem={createItem} />
}
```

### `components/Layout/Navigation.tsx`

"일정" 탭 링크 추가 (`/schedule`).

### `components/Schedule/ScheduleTable.tsx` (신규)

- `dateGroups` useMemo
- `editingCell` state
- `pendingRows` state (새 항목 임시 보관)
- DateGroup 리스트 렌더링

### `components/Schedule/DateGroupHeader.tsx` (신규)

Props:
```ts
interface DateGroupHeaderProps {
  date: string           // 'YYYY-MM-DD' or '__undated__'
  dayOffset: number | null
  totalBudget: number
  isCollapsed: boolean
  onToggleCollapse: () => void
  onAddItem: () => void
}
```

### `components/Schedule/TableRow.tsx` (신규)

Props:
```ts
interface TableRowProps {
  item: TripItem
  editingField: EditingCell['field'] | null  // 이 행의 편집 중인 필드
  onCellClick: (field: EditingCell['field']) => void
  onCellChange: (field: keyof TripItem, value: unknown) => void
  onCellBlur: () => void
  onKeyDown: (e: KeyboardEvent, field: EditingCell['field']) => void
  onOpenPanel: (id: string) => void
}
```

내부 `localValues` state로 편집 중인 값을 관리. blur/flush 시 `onCellChange` 호출.

### `components/Schedule/cells/` (신규, 셀 컴포넌트)

```
cells/
  TimeCell.tsx        텍스트 입력, HH:MM 포맷 검증
  NameCell.tsx        텍스트 입력
  CategoryCell.tsx    이모지 그리드 팝오버
  StatusCell.tsx      4개 옵션 팝오버 (컬러 도트 + 라벨)
  BudgetCell.tsx      숫자 입력, 통화 포맷 표시
```

각 셀은 `isEditing: boolean`, `value`, `onChange`, `onBlur`, `onKeyDown` props를 받는 단순 표현 컴포넌트.

### `components/Panel/ItemPanel.tsx`

변경 없음. ScheduleTable에서도 기존 패널을 `selectedItemId` state로 제어.

## 컴포넌트 인터페이스 요약

```ts
// ScheduleTable
interface ScheduleTableProps {
  items: TripItem[]
  onUpdateItem: (id: string, changes: Partial<TripItem>) => Promise<void>
  onCreateItem: (item: Partial<TripItem>) => Promise<TripItem>
}

// TableRow
interface TableRowProps {
  item: TripItem
  editingField: EditingCell['field'] | null
  onCellClick: (field: EditingCell['field']) => void
  onCellChange: (field: keyof TripItem, value: unknown) => void
  onCellBlur: () => void
  onKeyDown: (e: React.KeyboardEvent, field: EditingCell['field']) => void
  onOpenPanel: (id: string) => void
}
```

## 엣지 케이스

| 케이스 | 처리 |
|--------|------|
| 날짜 없는 항목 | "날짜 미정" 그룹으로 하단에 표시 |
| 시간 없는 항목 | `--:--` 표시, 그룹 내 하단 배치 |
| 이름 비우고 blur | 변경 취소, 원래 이름 복원 (이름은 필수 필드) |
| 새 항목 이름 비우고 blur | 고스트 행으로 복귀 (항목 미생성) |
| PATCH 실패 | 로컬 state 이전 값으로 revert + toast |
| 편집 중 페이지 이탈 | `beforeunload`에서 debounce flush |
| 같은 날짜 항목이 100개 이상 | `useMemo` 메모이제이션, 가상 스크롤은 이슈 발생 시 후속 대응 |
| 모바일 탭 키 없음 | 다음 행 이름 셀로 이동 (Enter와 동일 동작) |
