# Feature Specification: Map Loading State Alignment

**Feature Branch**: `codex/292-map-loading-state`  
**Created**: 2026-06-30  
**Status**: Draft  
**Input**: GitHub issue #292 - 지도 뷰 스켈레톤이 최종 화면의 주요 레이아웃을 보존한다

## User Scenarios & Testing

### User Story 1 - 지도 진입 중 최종 레이아웃을 예측한다 (Priority: P1)

지도 뷰로 이동하는 사용자는 로딩 중에도 최종 화면의 큰 구조가 지도와 사이드 패널이라는 점을 바로 알 수 있어야 한다.

**Why this priority**: 로딩 UI가 실제 지도 화면과 닮지 않으면 전환 후 레이아웃 점프처럼 느껴지고, 스켈레톤이 잘못된 약속을 하게 된다.

**Independent Test**: `/trip/[tripId]/map` route loading state를 확인해 데스크톱은 좌측 패널+우측 지도, 모바일은 지도+하단 패널 구조를 유지하는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 데스크톱 폭에서 지도 뷰가 로딩 중일 때, **When** loading UI가 표시되면, **Then** 좌측 패널 폭과 우측 지도 영역이 최종 지도 뷰와 같은 구조로 보인다.
2. **Given** 모바일 폭에서 지도 뷰가 로딩 중일 때, **When** loading UI가 표시되면, **Then** 지도 영역과 40vh 하단 패널이 최종 지도 뷰와 같은 구조로 보인다.

### Edge Cases

- 로딩 중에도 네비게이션 영역은 최종 화면과 같은 위치를 유지해야 한다.
- 스켈레톤은 실제 지도 화면에 없는 배지나 가짜 콘텐츠를 약속하지 않아야 한다.

## Requirements

### Functional Requirements

- **FR-001**: 지도 route는 전용 loading shell을 제공해야 한다.
- **FR-002**: 데스크톱 loading shell은 최종 화면의 360px 사이드 패널과 지도 영역을 보존해야 한다.
- **FR-003**: 모바일 loading shell은 최종 화면의 지도 영역, 하단 패널 높이, 네비게이션 위치를 보존해야 한다.
- **FR-004**: 지도 placeholder는 지도 영역임을 암시하되 실제 데이터 마커나 존재하지 않는 항목을 약속하지 않아야 한다.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `app/trip/[tripId]/map/loading.tsx`가 route-level loading UI를 제공한다.
- **SC-002**: Loading shell의 주요 layout dimensions가 `PlanScreen` map view와 일치한다.
- **SC-003**: `npm run lint`와 `npm run build`가 통과한다.
