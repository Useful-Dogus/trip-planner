# Feature Specification: Dashboard Control Disclosure

**Feature Branch**: `tasks/issue-349-dashboard-controls`
**Created**: 2026-06-29
**Status**: Draft
**Input**: GitHub issue #349 "대시보드 검색·정렬·새 여행 컨트롤 노출 정리"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Early Dashboard Focuses New Trip (Priority: P1)

A user with 1-3 trips sees the existing trips and a clear "새 여행" action without prominent search/sort controls.

**Why this priority**: Search and sort are low-value until the trip list has enough items.

**Independent Test**: Render the dashboard with 1-3 trips and confirm only the count and "새 여행" appear above the grid.

**Acceptance Scenarios**:

1. **Given** a user has 1 trip, **When** the dashboard loads, **Then** search and sort controls are hidden and "새 여행" remains visible.
2. **Given** a user has 3 trips, **When** the dashboard loads, **Then** search and sort controls are still hidden.

### User Story 2 - Larger Dashboard Keeps Search And Sort (Priority: P2)

A user with more than 3 trips can search and sort the trip list.

**Why this priority**: Search/sort become useful when the list is large enough.

**Independent Test**: Render the dashboard with 4 trips and confirm search, sort, and "새 여행" align in the top controls.

**Acceptance Scenarios**:

1. **Given** a user has 4 trips, **When** the dashboard loads, **Then** search, sort, and "새 여행" are visible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Dashboard MUST hide search and sort when trip count is 1-3.
- **FR-002**: Dashboard MUST keep "새 여행" visible when trip count is 1 or more.
- **FR-003**: Dashboard MUST keep empty-state "첫 여행 만들기" for 0 trips.
- **FR-004**: Dashboard MUST show search and sort when trip count is greater than 3.
- **FR-005**: Visible controls MUST use consistent height and alignment.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0-3 trip states emphasize creating or entering trips instead of search/sort.
- **SC-002**: 4+ trip states retain search/sort.
