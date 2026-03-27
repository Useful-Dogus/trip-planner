# Contract: useItems Hook

**Type**: Client-side Hook Interface
**Feature**: 005-data-caching-fast-ux

---

## Purpose

`useItems`는 앱 전체에서 아이템 데이터에 접근하는 단일 진입점이다. 직접 `fetch('/api/items')`를 호출하는 패턴을 모두 대체한다.

---

## Interface

```typescript
function useItems(): UseItemsReturn
```

### Return Type

```typescript
type SyncStatus = 'fresh' | 'stale' | 'offline' | 'error'

interface UseItemsReturn {
  items: TripItem[]
  isLoading: boolean
  isValidating: boolean
  syncStatus: SyncStatus
  error: Error | null

  createItem(item: Omit<TripItem, 'id' | 'created_at' | 'updated_at'>): Promise<void>
  updateItem(id: string, changes: Partial<TripItem>): Promise<void>
  deleteItem(id: string): Promise<void>
  updateStatus(id: string, status: Status): Promise<void>
}
```

---

## Behavior Contracts

### isLoading
- `true` 조건: 캐시(메모리 + localStorage)가 비어 있고 첫 서버 응답을 기다리는 중
- `false` 조건: 캐시 데이터가 하나라도 있으면 항상 false (백그라운드 갱신 중에도)

### isValidating
- `true` 조건: 백그라운드에서 서버 요청이 진행 중
- UI는 isValidating 동안에도 현재 items를 그대로 표시해야 함

### createItem
- 호출 즉시 임시 ID(`tmp_${Date.now()}`)로 items 배열에 추가 (낙관적)
- 서버 성공 시: 임시 ID를 서버 ID로 교체, UI 변화 없음
- 서버 실패 시: 임시 아이템 제거, 토스트 실패 알림 + 재시도 버튼 표시

### updateItem
- 호출 즉시 해당 ID 아이템의 변경값 반영 (낙관적)
- 서버 실패 시: 이전 값으로 롤백, 토스트 실패 알림 + 재시도 버튼 표시

### deleteItem
- 호출 즉시 해당 ID 아이템 목록에서 제거 (낙관적)
- 서버 실패 시: 아이템 복원, 토스트 실패 알림 + 재시도 버튼 표시

### updateStatus
- updateItem의 특수 케이스 (`changes: { status }`)
- 카드의 상태 뱃지 드롭다운에서 호출

---

## Error Handling

모든 쓰기 연산에서 서버 오류 발생 시:
1. 낙관적 상태 롤백
2. `syncStatus`를 `'error'`로 변경
3. 토스트 알림 표시 (4초 자동 소멸 + 재시도 버튼)
4. 재시도 버튼 클릭 시 동일 연산 재실행

---

## Cache Behavior

| 상황 | 동작 |
|------|------|
| 첫 마운트, 캐시 없음 | 서버 fetch → isLoading=true |
| 첫 마운트, localStorage 캐시 있음 | 캐시 즉시 표시 + 백그라운드 갱신 |
| 탭 전환 | 캐시 즉시 표시 (isLoading=false) |
| 포커스 복귀 (30초+ 이후) | 캐시 표시 + 자동 백그라운드 갱신 |
| 오프라인 | 캐시 표시, 쓰기 연산 차단 + 안내 메시지 |
| 캐시 24시간 초과 | 만료 처리 후 isLoading=true로 서버 fetch |

---

## Migration Guide

기존 패턴 → 새 패턴:

```typescript
// Before (research/page.tsx, schedule/page.tsx)
const [items, setItems] = useState<TripItem[]>([])
const [loading, setLoading] = useState(true)
useEffect(() => {
  fetch('/api/items').then(r => r.json()).then(data => {
    setItems(data.items ?? [])
    setLoading(false)
  })
}, [])

// After
const { items, isLoading } = useItems()
```

```typescript
// Before (PanelItemForm.tsx)
const res = await fetch(`/api/items/${item.id}`, { method: 'PUT', body: ... })
if (res.ok) onSave(updated)

// After
await updateItem(item.id, changes)
onClose()  // 낙관적 업데이트로 이미 반영됨
```
