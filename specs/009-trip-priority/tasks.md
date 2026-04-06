# 009 — 구현 태스크

- [x] types/index.ts: TripPriority 타입 추가, Status/Priority 제거, TripItem 수정
- [x] lib/itemOptions.ts: TRIP_PRIORITY 관련 추가, 구 필드 제거
- [x] lib/data.ts: rowToItem 마이그레이션 로직, itemToRow 매핑 수정
- [x] app/api/items/route.ts: 유효성 검사 수정
- [x] app/api/items/[id]/route.ts: 유효성 검사 수정
- [x] app/api/gmaps/import/route.ts: 기본값 수정
- [x] components/UI/TripPriorityBadge.tsx: 신규 생성
- [x] components/UI/StatusBadge.tsx: 삭제
- [x] components/UI/PriorityBadge.tsx: 삭제
- [x] components/UI/ItemMetadataChips.tsx: TripPriorityBadge 사용
- [x] components/Panel/ItemPanel.tsx: 드롭다운 통합
- [x] components/Items/ItemForm.tsx: trip_priority 단일 필드
- [x] components/Panel/PanelItemForm.tsx: trip_priority 단일 필드
- [x] components/Items/ItemList.tsx: 필터/정렬 수정
- [x] npm run build 통과
