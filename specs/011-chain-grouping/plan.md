# 011 — 기술 설계 (plan.md)

## 아키텍처 결정

### 그룹핑 데이터 흐름

```
items (전체, pre-filter)
  ↓ useMemo — allGroups 계산
  Map<normalizedName, TripItem[]>   ← 그룹 구성원 전체 목록

filtered (post-filter + sort)
  ↓ useMemo — renderEntries 계산
  RenderEntry[]   ← single | group
  각 entry의 정렬 키를 그룹 대표값으로 산출
```

### RenderEntry 타입

```ts
type RenderEntry =
  | { type: 'single'; item: TripItem }
  | { type: 'group'; name: string; visibleItems: TripItem[]; totalCount: number }
```

### 정렬 로직 변경

현재: `filtered` 배열을 flat하게 정렬 후 렌더링
변경: `renderEntries`를 생성 후 정렬

그룹의 정렬 대표값:
- `name`: 그룹 이름
- `date`: visibleItems 중 가장 이른 date (없으면 '')
- `budget`: visibleItems 중 최솟값 (없으면 0)
- `trip_priority`: visibleItems 중 가장 높은 우선순위의 order값

### 인라인 이름 편집

`updateItem`을 Research page → ItemList → ItemCard/GroupCard 로 prop drilling.

SWR 낙관적 업데이트가 이미 `useItems.updateItem`에 구현되어 있으므로 재활용.

GroupCard 배치 rename: `Promise.all(items.map(i => onUpdateItem(i.id, { name: newName })))`
SWR mutate는 마지막 호출이 전체를 재검증하므로 중복 revalidation이 발생할 수 있으나, 수십 개가 아닌 소규모 그룹이라 허용.

### 지도 연동 (그룹 자동 펼침)

GroupCard에서 `useEffect`:
```ts
useEffect(() => {
  if (visibleItems.some(i => i.id === selectedItemId)) {
    setIsOpen(true)
  }
}, [selectedItemId])
```

selectedItemId가 그룹 소속이면 자동 펼침.

## 파일별 변경 계획

### `types/index.ts`
- `Branch` 인터페이스 제거
- `TripItem`에서 `is_franchise`, `branches` 필드 제거

### `app/research/page.tsx`
- `useItems()`에서 `updateItem` 추출
- `ItemList`에 `onUpdateItem` prop 추가

### `components/Items/ItemList.tsx`
- Props: `onUpdateItem` 추가
- `allGroups` useMemo: `items` 기반 그룹 맵 생성
- `renderEntries` useMemo: `filtered` + `allGroups` 기반 렌더 엔트리 생성
- 렌더링: `entry.type === 'group'` → `<GroupCard>`, `'single'` → `<ItemCard>`
- 항목 수 표시: 그룹 내 지점 포함 총 아이템 수로 표시

### `components/Items/GroupCard.tsx` (신규)

Props:
```ts
interface GroupCardProps {
  name: string
  visibleItems: TripItem[]
  totalCount: number
  selectedItemId: string | null
  onSelectItem: (id: string) => void
  onUpdateItem: (id: string, changes: Record<string, unknown>) => void
}
```

내부 state:
- `isOpen: boolean` (기본 false)
- `editingName: string | null` (인라인 편집 중인 이름)

### `components/Items/ItemCard.tsx`
- `onUpdateItem` prop 추가 (optional, 없으면 인라인 편집 비활성)
- 이름 span에 `onDoubleClick` 핸들러 추가
- `is_franchise`/`branches` 관련 렌더링 코드 제거
- `branchesOpen` state 제거

## 컴포넌트 인터페이스

```ts
// ItemCard
interface ItemCardProps {
  item: TripItem
  onSelect?: (id: string) => void
  isActive?: boolean
  onUpdateItem?: (id: string, changes: Record<string, unknown>) => void  // 신규
}

// ItemList
interface ItemListProps {
  items: TripItem[]
  selectedItemId: string | null
  onSelectItem: (id: string) => void
  onUpdateItem: (id: string, changes: Record<string, unknown>) => void   // 신규
}
```

## 엣지 케이스

| 케이스 | 처리 |
|---|---|
| 그룹 내 모든 지점 필터 아웃 | renderEntries에서 제외 (그룹 숨김) |
| 그룹 내 일부 지점만 필터됨 | visibleItems = 필터된 것만, totalCount = 전체 |
| 배지: 전체 다 보임 | `N곳` |
| 배지: 일부만 보임 | `M/N곳` |
| 주소 없는 지점 | `(주소 없음)` 회색 이탤릭 |
| 인라인 편집 중 Escape | 원래 이름으로 복원 |
| 배치 rename 중 일부 실패 | 각 updateItem의 error handling이 개별 toast 처리 |
