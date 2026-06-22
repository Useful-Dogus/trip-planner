# Taste 감사 — Phase 1 핵심 표면 (2026-06-22)

> [taste-for-waypost.md](taste-for-waypost.md) 의 테넌트로 현재 Phase-1 핵심 표면 3곳을 훑은 시점 펀치리스트다. PG 의 "What a hack!" 음성으로 *추함을 알아본* 목록이며, 평가가 아니라 **고칠 거리** 다.
>
> 형식: `위치 · 위반 테넌트 · 고칠 방향`. 이미 [issue-map-moat-benefit.md](issue-map-moat-benefit.md) 에 있는 건 연결, 새로 발견된 hack 은 신규 이슈 제안으로 표시.
>
> 감사는 시점 스냅샷이므로 완료 후 갱신하지 않는다(Directory Rules 의 specs 보관 원칙과 동일). 다음 감사는 새 날짜로 새 파일.

---

## 표면 1 — Triage 상태 흐름

**현재 사실:**
- 상태 모델: `TripPriority = '검토 필요' | '시간 되면' | '가고 싶음' | '확정' | '제외'` ([types/index.ts:13](../types/index.ts:13), 메타 [lib/itemOptions.ts:100](../lib/itemOptions.ts:100))
- 상태 변경: schedule(PriorityCell 1클릭), list/research(테이블 셀 1클릭), map(상세 패널 진입 후 변경 = 2단계)
- "확정" → 날짜 배정은 **자동 연결 없음**. 별개 2동작.

| # | 위치 | 위반 테넌트 | 고칠 방향 |
|---|---|---|---|
| H1 | "확정" 상태 ↔ 날짜 배정 분리 ([app/trip/[tripId]/schedule/page.tsx](../app/trip/[tripId]/schedule/page.tsx)) | **1.2 Solves the right problem** (난로 다이얼) | "확정" 전환 시 날짜 배정 진입점을 같은 흐름에 노출. → 이슈맵 **#4** 와 직결, 그 이슈에 본 근거 연결 |
| H2 | 상태 모델이 전략 문서(`후보→보류→확정→탈락` 4상태)와 코드(5단계 우선순위)가 **다름** ([types/index.ts:13](../types/index.ts:13)) | **1.3 Suggestive** (멘탈 모델 불일치) | 둘 중 하나로 정렬. 5단계가 옳다면 전략·이슈맵 카피를 5단계로 갱신, 4상태가 옳다면 모델 단순화 검토. **신규 이슈 제안** (모델 정합성, 결정 필요) |
| H3 | map 사이드패널 후보 탭에서 상태 변경이 1클릭이 아니라 상세 패널 진입 후 2단계 ([components/Map/MapSidePanel.tsx](../components/Map/MapSidePanel.tsx)) | **1.5 Symmetry** (진입점 비대칭) | map 카드에서도 1클릭 상태 변경 도달. → 이슈맵 **#3**(6조합 동등 도달)에 포함 |

## 표면 2 — 일정 뷰 동선 표시

**현재 사실:**
- `DistanceSeparator` 로 인접 항목 간 직선거리 표시 이미 구현 (haversine, [components/Schedule/DistanceSeparator.tsx](../components/Schedule/DistanceSeparator.tsx))
- 좌표(lat/lng) 필드 존재 ([types/index.ts:28](../types/index.ts:28))
- **비효율 경고 없음.** 긴 거리도 짧은 거리와 동일한 `text-fg-subtle` — 위계 없음.

| # | 위치 | 위반 테넌트 | 고칠 방향 |
|---|---|---|---|
| H4 | 모든 거리가 같은 톤, 긴 동선/역행 구간 강조 없음 ([components/Schedule/ScheduleTable.tsx](../components/Schedule/ScheduleTable.tsx) DistanceSeparator) | **1.4 Hard, works on faces** (얼굴에 노력을) | 임계값 초과 구간에 정보성(차단 X) 경고 위계 부여. 이게 솔로 핵심 가치("안 깨지는 일정")의 얼굴이다. → 이슈맵 **#2** 와 직결 |
| H5 | 거리만 있고 이동 *시간* 추정 없음 (이슈맵 #1 은 시간 포함 요구) | **1.2 Solves the right problem** | "현장에서 안 깨지나"는 거리보다 시간이 본질. 좌표 기반 추정 시간 추가. → 이슈맵 **#1** |

## 표면 3 — 빈 상태·랜딩 카피

**현재 사실:**
- 카피는 이미 1인칭·솔로 정렬 (예: "가고 싶은 장소를 추가하면 여기에 모입니다" [components/Items/ItemList.tsx:303](../components/Items/ItemList.tsx:303))
- "함께/협업" 강조 카피는 거의 없음 (양호)
- 다만 **솔로-퍼스트 한 문장의 *가치* 를 운반하는 카피는 없음** — 일반적 안내에 그침.

| # | 위치 | 위반 테넌트 | 고칠 방향 |
|---|---|---|---|
| H6 | 빈 상태·랜딩이 "장소를 추가하세요" 수준의 일반 안내 ([app/dashboard/DashboardClient.tsx:201](../app/dashboard/DashboardClient.tsx:201), [components/Schedule/ScheduleTable.tsx:585](../components/Schedule/ScheduleTable.tsx:585)) | **1.7 Daring** (왜 이걸 쓰는가 한 문장) | 첫 진입 빈 상태 하나에 "후보 더미 → 안 깨지는 일정" 가치를 담되, **카피가 약속한 동작이 실제 가능한지** 확인(Basics-First #3). → 이슈맵 **#6** |
| H7 | EmptyState 부모 Sheet/Container 높이가 콘텐츠 적응형인지 미확인 ([components/UI/EmptyState.tsx](../components/UI/EmptyState.tsx)) | **1.1 Simple** / Basics-First #5 | 6곳 사용처의 부모 시트가 `maxHeight: 90vh; height: auto` 인지 점검. **신규 점검 항목** (확인 후 위반 시 이슈) |

---

## 요약 — 신규 이슈 제안 (이슈맵에 없던 것)

- **H2** — triage 상태 모델 정합성(5단계 우선순위 vs 4상태). *결정* 필요. 솔로-퍼스트 멘탈 모델을 코드/문서 중 어디에 맞출지.
- **H7** — EmptyState 부모 시트 사이징 점검(코드 확인 후 위반 시 이슈화).

나머지 H1·H3·H4·H5·H6 은 이슈맵 Phase-1 #1-#6 에 흡수되며, 각 이슈 본문에 해당 테넌트 근거를 붙인다.
