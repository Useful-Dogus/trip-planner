# 208-chip-variant — Plan

## Chip 컴포넌트 API 변경

```ts
type ChipVariant = 'neutral' | 'accent' | 'category'

interface ChipProps {
  variant?: ChipVariant  // default 'neutral'
  category?: Category    // variant='category' 일 때 사용
  size?: 'sm' | 'md'
  leading?: ReactNode    // 명시적 leading override
  // ...
}
```

variant 별 클래스:

| variant | bg | border | text | leading |
|---|---|---|---|---|
| neutral | bg-bg-subtle | border-border | text-fg-muted | optional |
| accent | bg-accent-subtle | border-accent/30 | text-accent | optional |
| category | bg-bg-subtle | border-border | text-fg | category color dot 자동 + 카테고리 lucide 아이콘 (props.category 필요) |

`category` variant 는 자동으로 lucide Icon (props.category 의) 을 leading 으로 렌더. `leading` prop 으로 override 가능.

## 카테고리 컬러 톤 다이어트

현재 색 (채도 높음) → 한 단계 낮춤. Tailwind 스케일 기준 `400/500` → `300/400` 수준.

| Category | before | after | 비고 |
|---|---|---|---|
| 교통 | #94a3b8 (slate-400) | #94a3b8 | 이미 중성 |
| 숙박 | #0ea5e9 (sky-500) | #38bdf8 | sky-400 |
| 명소 | #f97316 (orange-500) | #fb923c | orange-400 |
| 식당 | #ef4444 (red-500) | #f87171 | red-400 |
| 카페 | #a16207 (yellow-700) | #b45309 | amber-700 좀 더 밝게 |
| 쇼핑 | #ec4899 (pink-500) | #f472b6 | pink-400 |
| 문화시설 | #8b5cf6 (violet-500) | #a78bfa | violet-400 |
| 공연·스포츠 | #10b981 (emerald-500) | #34d399 | emerald-400 |
| 액티비티 | #f59e0b (amber-500) | #fbbf24 | amber-400 |
| 휴양 | #22c55e (green-500) | #4ade80 | green-400 |
| 기타 | #cbd5e1 (slate-300) | #cbd5e1 | 유지 |

dot 으로만 사용되므로 채도 낮춰도 변별성 유지.

## 통합 지점

- `components/UI/ItemMetadataChips.tsx` CategoryChip → `<Chip variant="category" category={...}>...`
- `components/Share/SharedItemCard.tsx` 카테고리 칩 → 동일 패턴
- `components/Panel/ItemPanel.tsx` line 398 (CHIP_TONE inline) → `<Chip variant="neutral">`, line 420 placeholder → `<Chip variant="neutral" className="opacity-70">` 또는 별도 처리

## 비범위

- 50+ inline rounded-full 정리 — 후속 audit
- TripPriorityBadge / ReservationStatusBadge — 본 PR 범위 외

## 검증

- `npm run build` + `npm run lint`
- ItemMetadataChips 가 렌더링되는 화면(map sidepanel, schedule)에서 칩이 통일된 톤으로 보임
