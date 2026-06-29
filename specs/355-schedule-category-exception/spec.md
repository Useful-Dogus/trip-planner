# Feature Specification: Schedule Category Cell Exception Recovery

**Feature Branch**: `tasks/issue-355-category-icon-exception`
**Created**: 2026-06-29
**Status**: Draft
**Input**: GitHub issue #355 "일정 뷰 분류 아이콘 클릭 시 클라이언트 예외"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open Category Editor Without Crashing (Priority: P1)

A user editing the schedule table can click a row's category icon and see a category picker instead of the page switching to a client-side application error.

**Why this priority**: The current reported failure blocks a core daily schedule editing path and requires a refresh to recover.

**Independent Test**: Open the schedule table, click a category icon in a row, and confirm the category picker opens while the rest of the page remains interactive.

**Acceptance Scenarios**:

1. **Given** a schedule row with a valid category, **When** the user clicks the category icon, **Then** the category picker opens without a client exception.
2. **Given** a schedule row has an unexpected or legacy category value, **When** the row renders or the category icon is clicked, **Then** the UI falls back to a safe category display instead of throwing.

### User Story 2 - Recover From Category Save Failure (Priority: P2)

A user changing a category gets a recoverable failure message if the save request fails, and the table does not remain in a broken editing state.

**Why this priority**: Issue #355 asks that failures avoid full-screen crashes and remain recoverable in-place.

**Independent Test**: Trigger a failed category save and confirm the previous value is restored with a visible error message and retry path.

**Acceptance Scenarios**:

1. **Given** category saving fails, **When** the user selects a category, **Then** the optimistic value is rolled back and an error toast explains the failure.
2. **Given** the category picker is open, **When** the user selects a category or clicks outside, **Then** the picker closes cleanly.

### Edge Cases

- The category button is near the viewport edge and the portal dropdown needs to reposition.
- The source item contains a legacy category label not present in `CATEGORY_META`.
- The user is offline or the API rejects the update.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Category cell rendering MUST tolerate unexpected category values without throwing.
- **FR-002**: The category picker portal MUST only render when the browser document is available and a stable button position exists.
- **FR-003**: Category selection MUST close or advance editing state without leaving a stale open portal.
- **FR-004**: Failed item updates MUST restore the previous item state and show a user-visible error message.
- **FR-005**: Server-provided validation messages SHOULD be preserved when available.

### Key Entities

- **TripItem**: Existing schedule item whose `category` can be edited from the table.
- **Category**: Existing controlled category option set from `lib/itemOptions.ts`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Clicking a schedule row category icon no longer produces a full-screen client exception.
- **SC-002**: Invalid or legacy category values render with a fallback instead of crashing the schedule table.
- **SC-003**: Category save failures are recoverable without page refresh.
