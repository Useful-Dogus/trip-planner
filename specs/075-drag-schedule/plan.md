# 075-drag-schedule — Plan

## 라이브러리 선택

`@dnd-kit/core` + `@dnd-kit/utilities` 설치. `@dnd-kit/sortable` 은 같은 그룹 내 reorder 가 본 PR 범위 외라 미설치 (필요 시 후속 PR 에서 추가).

이유:
- 모바일 터치 + 데스크탑 포인터 양쪽 sensor 일급 지원
- accessibility (KeyboardSensor) 후속 도입 가능
- 가벼움 (drag overlay portal 내장)

## 구조

```
DndContext (ScheduleTable 루트)
├─ Sensors: PointerSensor (8px activation) + TouchSensor (long-press 250ms)
├─ DragOverlay → 드래그 중 카드 미리보기 (포털)
└─ 자식:
   ├─ DateGroupHeader (useDroppable, id=`date:${date}`)
   ├─ TableRow / MobileScheduleItemCard (useDraggable, id=`item:${itemId}`)
   └─ "날짜 미정" 헤더 (useDroppable, id=`date:__undated__`)
```

`onDragEnd` 핸들러:
1. `over` 가 null → no-op
2. `over.id` 가 `date:${date}` 형식이고 active 의 현재 date 와 다르면:
   - `date === '__undated__'` → `onUpdateItem(itemId, { date: null })`
   - else → `onUpdateItem(itemId, { date })`

## 드래그 트리거 정책

- **데스크탑**: `PointerSensor` `activationConstraint: { distance: 6 }` — 6px 이동 시 드래그 시작. 단순 클릭은 셀 편집 진입으로 보존.
- **모바일**: `TouchSensor` `activationConstraint: { delay: 250, tolerance: 8 }` — 250ms long-press 후 드래그. 일반 탭은 패널 열기로 보존.

## 시각 피드백

- 드래그 시작 시 원래 카드 `opacity-40`
- 드롭존 활성 시 `DateGroupHeader` 가 `ring-2 ring-accent ring-offset-2` 또는 background tinted (`bg-accent-subtle`)
- DragOverlay 카드: shadow-lg + slight rotate + cursor-grabbing

## 데이터 흐름

`onUpdateItem` 은 기존 prop 그대로 사용 — 호출 결과 SWR 가 낙관적 업데이트 후 재검증. 별도 mutation 추가 없음.

## 비범위

- `order` 필드 / 같은 그룹 내 reorder → 별도 이슈
- 키보드 드래그 → 별도 이슈
- 다중 선택 드래그 → #76 와 합쳐서 처리할 가능성

## 검증 방법

- `npm run build` 성공
- 로컬 dev 에서: 데스크탑 클릭 6px 이동 → 드래그, 다른 날짜로 드롭 → date 변경, optimistic UI 반영
- 모바일 (devtools) long-press → 동일
- 단순 클릭은 기존 셀 편집/패널 열기 동작 유지
