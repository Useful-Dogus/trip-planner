# 209-empty-state — 빈 상태 톤 통일

GitHub: #209 (부모 #205)

## 문제

빈 상태가 두 패턴으로 분기:
- A) `<EmptyState icon={<Lucide />}>` — DashboardClient(icon 누락), ItemList, MapSidePanel
- B) 인라인 `text-4xl` 이모지 (📍 🔍 🗓️) + 직접 마크업 — ResearchTable, ScheduleTable, ShareDialog, share/[token]/page

## 완료 조건

- 모든 빈 상태가 `EmptyState` 컴포넌트 사용
- 이모지 단독 0건
- icon = lucide, color = `text-fg-subtle` (neutral)
- 빌드·lint 통과

## 범위 밖

- TripPriority / Reservation 의 이모지 (별도 라운드)
- `#210` 디자인 가이드 보강
