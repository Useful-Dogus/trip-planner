# 207-lucide-category — 카테고리 아이콘셋 lucide 통일

GitHub: #207 (부모 #205)

## 문제

`lib/itemOptions.ts` 의 `CATEGORY_META` 가 이모지(`🚌 🏨 🏛️ …`) 를 사용. 플랫폼별 렌더링 차이가 크고("페르소나 테스트: 'AI 디자인 같다' 인상의 1차 원인"), 다크모드에서 톤 깨짐.

## 완료 조건

- `CATEGORY_META` 의 `emoji` 필드 제거, `Icon: LucideIcon` 으로 교체
- 카테고리를 표시하는 모든 React 컴포넌트가 lucide 아이콘 사용
- 지도 마커도 동일 lucide 아이콘으로 표시 (이모지/SVG 혼재 회피)
- 빌드·lint 통과

## 범위 밖

- 칩 컴포넌트 variant 통합 (`#208`)
- 빈 상태 톤 통일 (`#209`)
- 디자인 가이드 문서 보강 (`#210`)
- `TRIP_PRIORITY_META.emoji`, `RESERVATION_STATUS_META.emoji` — 본 PR 범위 외 (카테고리 한정). 다음 audit 라운드에서 정리.
