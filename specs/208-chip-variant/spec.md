# 208-chip-variant — 칩 컴포넌트 variant 통합 + 색상 다이어트

GitHub: #208 (부모 #205)

## 문제

`Chip` / `ChipButton` 컴포넌트는 있지만 단일 variant 만 지원. 대부분의 카테고리·메타 칩은 inline `rounded-full px-2 py-0.5 ...` 형태로 50+ 곳 산재. 카테고리는 무지개 색을 통한 구분 의존이 강해 "AI 디자인 같다" 인상에 기여.

## 완료 조건

- `Chip` 컴포넌트가 `variant: 'neutral' | 'accent' | 'category'` prop 지원
- `category` variant 는 배경 채도를 낮추고 leading dot 으로 카테고리 색을 보조 표시 (색을 칩 전체에 깔지 않음)
- 카테고리 칩이 노출되는 주요 지점 (`ItemMetadataChips`, `SharedItemCard`, `ItemPanel`) 이 통합 컴포넌트 사용
- 칩이 화면에 동시에 다수 떠 있어도 채도 높은 색이 5개 이상 겹치지 않음
- `lib/itemOptions.ts` 의 카테고리 색을 채도 한 단계 낮춤 (또는 light-mode 톤 정렬)
- 빌드·lint 통과

## 범위 밖

- 인라인 `rounded-full` 형태가 남아 있는 50+ 곳을 모두 Chip 컴포넌트로 마이그레이션 — 별도 후속 (#210 디자인 가이드 완료 후 audit 이슈로 분리)
- TripPriorityBadge / ReservationStatusBadge 의 색 단계 재검토 — 별도
- 빈 상태 톤 (#209)
