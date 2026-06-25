# Implementation Plan: Trip Pulse — 룰 기반 여행 상태 내레이션

**Branch**: `328-trip-pulse` | **Date**: 2026-06-25 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/328-trip-pulse/spec.md`

## Summary

Trip Pulse는 현재 trip의 `items` 배열을 읽어 목록·지도·일정 화면에 각각 1개의 짧은 여행 상태 문장을 표시한다. 목표는 단계를 강제하거나 작업 큐를 만드는 것이 아니라, 사용자가 모은 장소들이 여행으로 선명해지는 느낌을 주는 것이다.

기술 접근은 작게 유지한다. 순수 함수로 `items`를 집계하고 화면별 문장 우선순위를 결정한 뒤, 재사용 가능한 표시 컴포넌트를 기존 화면의 안전한 위치에 붙인다. DB, API, Supabase 스키마, item 데이터 변경은 없다.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Next.js 14 App Router  
**Primary Dependencies**: Next.js, React, Tailwind CSS, lucide-react, existing `useItems()` hook  
**Storage**: N/A. 영구 저장 없음  
**Testing**: `npm run lint`, `npm run build`; 문장 생성 순수 함수는 검증 케이스를 코드 가까이에 두거나 구현 시 기존 테스트 체계 부재를 보완할 최소 스크립트/수동 검증으로 확인  
**Target Platform**: Web, mobile and desktop browsers  
**Project Type**: Next.js web application  
**Performance Goals**: `items` 배열에 대한 O(n) 집계. 렌더당 계산 비용이 UI 체감에 영향을 주지 않아야 함  
**Constraints**: 외부 API/LLM 호출 금지, DB 변경 금지, 기존 검색·필터·정렬·URL 상태 변경 금지, 지도 조작 방해 금지  
**Scale/Scope**: `/trip/[tripId]/list`, `/trip/[tripId]/map`, `/trip/[tripId]/schedule` 3개 화면

## Constitution Check

`.specify/memory/constitution.md`는 placeholder 상태라 적용 가능한 프로젝트 원칙이 없다. 이 계획은 저장소의 실제 작업 규칙을 게이트로 사용한다.

- **Basics-First #1 컨텍스트 표시**: Trip Pulse는 기존 trip 제목 헤더/지도 패널과 함께 표시되어 trip 컨텍스트를 흐리지 않는다.
- **Basics-First #2 CRUD 대칭**: 새 영구 객체나 새 item 필드를 만들지 않으므로 CRUD 범위 없음.
- **Basics-First #3 카피 정직성**: 문장은 `items`에서 확인 가능한 사실만 말한다. 추천, 최적화, 완성도 같은 미구현 약속 금지.
- **Basics-First #4 진입점 일관성**: 선택 액션은 같은 trip 내부 기존 화면으로만 이동하고 기존 URL 상태를 깨지 않는다.
- **Design/Taste**: 큰 카드·작업 큐·단계 표시를 피하고, 작고 절제된 내레이션으로 유지한다.
- **Refactoring discipline**: 순수 함수/컴포넌트 추가와 화면 연결만 수행한다. unrelated refactor 금지.

## Project Structure

### Documentation

```text
specs/328-trip-pulse/
├── spec.md
└── plan.md
```

### Source Code

```text
lib/
└── tripPulse.ts              # metrics 계산 + surface별 summary 선택 순수 함수

components/Trip/
└── TripPulse.tsx             # 표시 컴포넌트

app/trip/[tripId]/
├── list/page.tsx             # 목록 헤더 아래 연결
└── schedule/page.tsx         # 일정 헤더 아래 연결

components/Plan/
└── PlanScreen.tsx            # 지도 화면에 전달 또는 배치

components/Map/
└── MapSidePanel.tsx          # 지도 패널 상단 연결
```

**Structure Decision**: 문장 생성은 `lib/tripPulse.ts`의 순수 함수로 둔다. UI는 `components/Trip/TripPulse.tsx`로 분리한다. 목록/일정은 페이지에서 직접 표시하고, 지도는 `MapSidePanel` 상단에 표시한다.

## Design Decisions

### 1. Summary Model

`TripPulseSummary`는 표시용 값만 가진다.

```ts
type TripPulseSurface = 'list' | 'map' | 'schedule'

interface TripPulseAction {
  label: string
  href: string
}

interface TripPulseSummary {
  title: string
  action?: TripPulseAction
}
```

보조 문장은 스펙상 허용하지만 v1 구현에서는 생략한다. 화면 밀도가 낮고 카피가 충분히 자연스러울 때만 후속으로 추가한다.

### 2. Metrics

집계는 `items` 배열 1회 순회로 계산한다.

- `total`
- `activeTotal`: `trip_priority !== '제외'`
- `wantCount`: `trip_priority === '가고 싶음'`
- `confirmedCount`: `trip_priority === '확정'`
- `reviewCount`: `trip_priority === '검토 필요'`
- `mappedCount`: `lat`/`lng`가 모두 number인 항목
- `mappedConfirmedCount`: `확정` + 좌표 있음
- `scheduledConfirmedCount`: `확정` + `date` 있음
- `scheduledDayCount`: `확정` + `date`의 고유 날짜 수
- `undatedConfirmedCount`: `확정` + `date` 없음

### 3. Rule Priority

공통 우선순위는 스펙의 clarification을 따른다.

1. 일정에 들어간 장소
2. 확정한 장소
3. 가고 싶은 곳
4. 지도에 표시 가능한 곳
5. 전체 후보
6. 빈 상태

화면별로 같은 metrics를 쓰되 표면에 맞는 문장으로 바꾼다.

### 4. Copy Set V1

초기 문장은 보수적으로 제한한다.

목록:

- `아직 첫 장소를 기다리고 있어요`
- `가고 싶은 곳이 N곳 모였어요`
- `N곳이 이번 여행에 들어갔어요`
- `후보 N곳을 살펴보고 있어요`

지도:

- `지도에 N곳을 펼쳐봤어요`
- `이번 여행에 들어간 N곳을 지도에서 보고 있어요`
- `아직 지도에 펼칠 장소를 기다리고 있어요`

일정:

- `N곳이 일정에 들어갔어요`
- `M일의 여행이 채워지고 있어요`
- `아직 날짜를 정하지 않은 곳도 있어요`
- `일정에 넣을 장소를 기다리고 있어요`

금지 표현은 spec의 FR-007을 그대로 적용한다.

### 5. Placement

- 목록: 기존 데스크탑 헤더 body 아래, 모바일 목록 컨텐츠 상단.
- 일정: `TripPageHeader` 아래, skeleton/content 위.
- 지도: `MapSidePanel` 최상단. 지도 위 오버레이에는 추가하지 않는다.

### 6. Actions

화면별 액션은 최대 1개이며, 작게 표시한다.

- 목록: `지도에서 보기` → `/trip/[tripId]/map`
- 지도: `일정에서 보기` → `/trip/[tripId]/schedule`
- 일정: `목록에서 보기` → `/trip/[tripId]/list`

액션은 기존 route 이동만 수행한다. 필터 변경, item 수정, 자동 배치 같은 동작은 하지 않는다.

## Implementation Phases

### Phase 1 - Domain Logic

1. `lib/tripPulse.ts` 추가.
2. `getTripPulseMetrics(items)` 구현.
3. `getTripPulseSummary(surface, items, paths)` 구현.
4. 대표 케이스를 함수 수준에서 확인할 수 있게 fixture 또는 inline 검증 가능한 구조로 작성.

### Phase 2 - UI Component

1. `components/Trip/TripPulse.tsx` 추가.
2. props는 `summary` 또는 `surface/items/tripPath` 중 하나로 좁힌다. 추천은 컴포넌트가 summary만 받아 UI 책임만 갖는 구조.
3. 기존 토큰(`bg-bg-elevated`, `border-border`, `text-fg`, `text-fg-muted`, `accent`) 사용.
4. 큰 카드 느낌을 피하고 얇은 bordered section 또는 compact panel로 구현.

### Phase 3 - Screen Integration

1. `/trip/[tripId]/list/page.tsx`에 목록용 summary 연결.
2. `/trip/[tripId]/schedule/page.tsx`에 일정용 summary 연결.
3. `PlanScreen` 또는 `MapSidePanel`에 지도용 summary 연결. 최종 배치는 `MapSidePanel` 상단.
4. 로딩 중에는 표시하지 않거나 skeleton 없이 생략한다.

### Phase 4 - Verification

1. `npm run lint`
2. `npm run build`
3. 수동 검증:
   - 빈 trip
   - 후보만 있는 trip
   - `가고 싶음` 3개 이상
   - `확정` 있음
   - 좌표 있는 항목 있음
   - 날짜 있는 확정 항목 있음
   - 모바일 375px에서 문장/액션 잘림 없음

## Quality Gates

- 문장에 금지 표현이 들어가지 않는다.
- 문장은 실제 데이터에서 확인 가능한 사실만 말한다.
- 지도 위 조작 영역을 새 UI가 가리지 않는다.
- 기존 `item` URL param, 검색, 필터, 정렬, 패널 열림 상태에 영향을 주지 않는다.
- 새 DB/API/env 변경이 없다.
- `npm run lint`와 `npm run build`가 통과한다.

## Risks

- **톤이 여전히 업무적으로 느껴질 위험**: 문장 수를 줄이고 금지 표현을 명확히 유지한다.
- **화면 밀도 증가**: 보조 문장을 v1에서 생략하고, 표시 위치를 헤더/패널 안으로 제한한다.
- **룰 우선순위가 기대와 다를 위험**: 순수 함수로 격리해 카피와 우선순위를 쉽게 조정할 수 있게 한다.
- **테스트 체계 부재**: 현재 repo에는 별도 unit test runner가 없다. 구현 시 함수 검증을 수동/스크립트로 보완하거나, test runner 도입은 별도 작업으로 분리한다.

## Out of Scope

- LLM/AI 문장 생성
- 사용자별 개인화/숨김 설정
- 단계 저장 또는 진행률
- 자동 일정 생성
- item 데이터 수정
- DB/API 변경
- 기존 historical specs 업데이트

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| N/A | N/A | N/A |
