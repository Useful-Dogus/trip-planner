# Data Model: 패널 기반 편집 UX

**Branch**: `003-panel-editing-ux` | **Date**: 2026-03-25

## UI 상태 모델 (클라이언트 전용)

### PanelState

패널 열림/닫힘과 현재 선택된 항목을 표현하는 클라이언트 UI 상태.

```typescript
// ResearchPage 내 useState
const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

// 파생 상태
const selectedItem = items.find(i => i.id === selectedItemId) ?? null
const isPanelOpen = selectedItemId !== null
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `selectedItemId` | `string \| null` | 패널에 표시 중인 TripItem의 id. null이면 패널 닫힘 |

### PanelMode

패널 내 콘텐츠 표시 모드.

```typescript
type PanelMode = 'view' | 'edit'
```

| 값 | 설명 |
|----|------|
| `view` | 읽기 모드. 상세 정보 표시, 편집 버튼 제공 |
| `edit` | 편집 모드. 인라인 폼 표시, 저장/취소 버튼 제공 |

## 컴포넌트 인터페이스

### ItemPanel

```typescript
interface ItemPanelProps {
  item: TripItem | null       // null이면 패널 닫힘 (애니메이션 유지 위해 마지막 item 캐싱)
  isOpen: boolean
  onClose: () => void
  onSave: (updated: TripItem) => void
  onDelete: (id: string) => void
}
```

### ItemCard (변경)

```typescript
// 기존: item prop만 받음
// 변경: onSelect 콜백 + isActive 추가
interface ItemCardProps {
  item: TripItem
  onSelect: (id: string) => void  // 카드 클릭 시 호출
  isActive: boolean               // true이면 Active State 스타일 적용
}
```

### ItemList (변경)

```typescript
interface ItemListProps {
  items: TripItem[]
  selectedItemId: string | null   // 현재 선택된 항목 id
  onSelectItem: (id: string) => void
}
```

## 데이터 플로우

```
ResearchPage
  ├── items: TripItem[]           (서버에서 fetch)
  ├── selectedItemId: string|null (패널 상태)
  │
  ├── ItemList
  │   └── ItemCard (×N)
  │       ├── onSelect → setSelectedItemId(id)
  │       └── isActive = (item.id === selectedItemId)
  │
  └── ItemPanel
      ├── onSave(updated) → setItems(items.map(i => i.id === updated.id ? updated : i))
      └── onDelete(id)   → setItems(items.filter(i => i.id !== id))
                           + setSelectedItemId(null)
```

## API 인터페이스 (기존 유지)

패널 내 저장은 기존 API 그대로 활용:

- `PUT /api/items/[id]` — 편집 저장. 응답: `{ item: TripItem }`
- `DELETE /api/items/[id]` — 항목 삭제. 응답: `{ ok: true }`
