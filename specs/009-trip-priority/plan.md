# 009 — 구현 계획

## 핵심 설계 결정

- DB `status` 컬럼에 `trip_priority` 값 저장 (컬럼명 변경 없음)
- `priority` 컬럼은 null로 유지 (하위 호환, 마이그레이션 완료 후 무시)
- `normalizeTripItem`이 마이그레이션 로직 담당 → 읽을 때 변환, 변경 감지 시 write-back

## 변경 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `types/index.ts` | `TripPriority` 추가, `Status`/`Priority` 제거, `TripItem.status` → `trip_priority` |
| `lib/itemOptions.ts` | `TRIP_PRIORITY_OPTIONS`, `TRIP_PRIORITY_META` 추가; 구 status/priority 관련 제거 |
| `lib/data.ts` | `rowToItem` 마이그레이션 로직, `itemToRow` 저장 매핑, `validateItem` 수정 |
| `app/api/items/route.ts` | 유효성 검사 `TRIP_PRIORITY_OPTIONS` 기준으로 교체 |
| `app/api/items/[id]/route.ts` | 동일 |
| `app/api/gmaps/import/route.ts` | 신규 아이템 기본값 `trip_priority: '검토 필요'` |
| `components/UI/TripPriorityBadge.tsx` | 신규: 5단계 색상 칩 |
| `components/UI/StatusBadge.tsx` | 삭제 |
| `components/UI/PriorityBadge.tsx` | 삭제 |
| `components/UI/ItemMetadataChips.tsx` | `TripPriorityBadge` 사용, priority 칩 제거 |
| `components/Panel/ItemPanel.tsx` | savingField/openField 타입 수정, 드롭다운 통합 |
| `components/Items/ItemForm.tsx` | `trip_priority` 단일 필드로 교체 |
| `components/Panel/PanelItemForm.tsx` | 동일 |
| `components/Items/ItemList.tsx` | 필터/정렬 `trip_priority` 기준으로 교체 |

## TripPriorityBadge 색상 설계

| 값 | 배경 | 텍스트 |
|---|---|---|
| `검토 필요` | gray-100 | gray-500 |
| `시간 되면` | blue-50 | blue-500 |
| `가고 싶음` | amber-50 | amber-600 |
| `확정` | emerald-100 | emerald-700 |
| `제외` | red-50 | red-400 |
