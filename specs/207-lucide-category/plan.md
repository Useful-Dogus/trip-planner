# 207-lucide-category — Plan

## 아이콘 매핑

| Category | lucide | 기존 emoji | 사유 |
|---|---|---|---|
| 교통 | `Bus` | 🚌 | 직관적 |
| 숙박 | `Hotel` | 🏨 | 직관적 |
| 명소 | `Landmark` | 🏛️ | 직관적 |
| 식당 | `UtensilsCrossed` | 🍽️ | 식기 교차 |
| 카페 | `Coffee` | ☕ | 직관적 |
| 쇼핑 | `ShoppingBag` | 🛍️ | 직관적 |
| 문화시설 | `Palette` | 🎨 | 미술·전시 톤 |
| 공연·스포츠 | `Drama` | 🎭 | 무대 마스크 |
| 액티비티 | `Target` | 🎯 | 직관적 |
| 휴양 | `Palmtree` | 🌴 | 직관적 |
| 기타 | `Bookmark` | 🔖 | 직관적 |

색상은 기존 brand 컬러 유지 (#208 칩 정리 단계에서 재검토).

## `CATEGORY_META` 새 시그니처

```ts
import type { LucideIcon } from 'lucide-react'

export const CATEGORY_META: Record<Category, { Icon: LucideIcon; color: string }> = {
  교통: { Icon: Bus, color: '#94a3b8' },
  // ...
}
```

기존 `.emoji` 사용 지점은 컴파일 에러로 모두 검출 → 일괄 교체.

## 지도 마커 처리 (Leaflet divIcon)

Leaflet 은 SVG/HTML 문자열을 받는다. lucide React 컴포넌트를 직접 못 박으니, `react-dom/server` 의 `renderToStaticMarkup` 으로 SSR-style 렌더 → SVG 문자열 추출.

```ts
// lib/categoryIcon.ts
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'

const cache = new Map<string, string>()
export function categoryIconSvg(
  category: Category,
  opts: { size?: number; color?: string; strokeWidth?: number } = {},
): string {
  const key = `${category}:${opts.size ?? 16}:${opts.color ?? 'currentColor'}:${opts.strokeWidth ?? 2}`
  const hit = cache.get(key)
  if (hit) return hit
  const { Icon } = CATEGORY_META[category]
  const svg = renderToStaticMarkup(
    createElement(Icon, { size: opts.size ?? 16, color: opts.color ?? 'currentColor', strokeWidth: opts.strokeWidth ?? 2 }),
  )
  cache.set(key, svg)
  return svg
}
```

`renderToStaticMarkup` 은 React 18 의 일반 server export — 클라이언트 번들에서도 import 가능. 호출 한 번에 SVG 문자열 + 캐시. 11개 카테고리 × (마커 사이즈) 만큼만 캐시되므로 비용 무시 가능.

지도 마커 함수(`chipIcon`, `createEmojiChipIcon`) 가 emoji 자리에 `categoryIconSvg(category, { size, color: 'white' })` 결과를 HTML 안에 임베드.

## 영향 범위 (grep `CATEGORY_META\|\.emoji` 결과)

- `components/UI/ReservationStatusBadge.tsx` (status emoji — 본 PR 범위 외, 카테고리 무관)
- `components/UI/ItemMetadataChips.tsx`
- `components/UI/TripPriorityBadge.tsx` (priority emoji — 본 PR 범위 외)
- `components/Schedule/CategoryStackBar.tsx`
- `components/Schedule/ScheduleTable.tsx` (MobileScheduleItemCard + DragPreviewCard)
- `components/Schedule/DayTimeline.tsx`
- `components/Schedule/cells/CategoryCell.tsx`
- `components/Schedule/cells/PriorityCell.tsx` (priority — 범위 외)
- `components/Map/TripPlannerMap.tsx`
- `components/Map/ResearchMap.tsx`
- `components/Map/MapSidePanel.tsx`
- `components/Items/ItemCard.tsx`
- `components/Items/GroupCard.tsx`
- `components/Share/SharedItemCard.tsx`

위 중 카테고리 emoji 만 교체. 우선순위/예약상태 emoji 는 본 PR 범위 외.

## 검증

- `npm run build` + `npm run lint`
- 컴파일 에러로 누락 사용처 없음 확인
- 지도 페이지에서 마커 lucide 표시
