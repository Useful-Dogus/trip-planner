# Feature Specification: Schedule Time Input Policy

**Feature Branch**: `tasks/issue-354-time-input-policy`
**Created**: 2026-06-29
**Status**: Draft
**Input**: GitHub issue #354 "일정 테이블 시간 입력 포맷·저장·오류 정책 정리"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Natural Time Entry (Priority: P1)

A user can enter common time formats in the schedule table and have them saved as canonical `HH:MM`.

**Why this priority**: Schedule editing is a core flow, and values like `0800` currently fail even though users naturally type them.

**Independent Test**: Edit a schedule row time to `0800`, Tab away, and confirm the item saves as `08:00`.

**Acceptance Scenarios**:

1. **Given** a row has no start time, **When** the user enters `0800`, **Then** the value is saved as `08:00`.
2. **Given** a row has no start time, **When** the user enters `8:30`, **Then** the value is saved as `08:30`.

### User Story 2 - Partial Input Does Not Save (Priority: P2)

A partial time entry does not send a PATCH request or move focus as if it were valid.

**Why this priority**: The issue reports that `01` followed by Tab can send an invalid save request.

**Independent Test**: Type `01` in a time cell and press Tab; focus stays in the cell and an inline error appears.

**Acceptance Scenarios**:

1. **Given** a time cell is editing, **When** the user types `01` and presses Tab, **Then** no save is attempted and the cell explains that the time is incomplete.
2. **Given** a time cell is editing, **When** the user types an invalid value, **Then** the error is shown next to the cell and can be corrected in place.

### User Story 3 - API Uses Same Policy (Priority: P3)

Direct item API writes accept and normalize the same time formats as the schedule table.

**Why this priority**: Server and client validation must not drift.

**Independent Test**: Send `time_start: "0800"` to item create/update API and confirm it persists as `08:00`.

**Acceptance Scenarios**:

1. **Given** an item PATCH contains `time_start: "0800"`, **When** the API validates it, **Then** the update is accepted and normalized.
2. **Given** an item PATCH contains `time_start: "01"`, **When** the API validates it, **Then** the update is rejected with a corrective message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Accepted time formats MUST include `HH:MM`, `H:MM`, and compact `HHMM` or `HMM`.
- **FR-002**: Saved time values MUST be normalized to `HH:MM`.
- **FR-003**: Partial values such as `01` MUST NOT trigger schedule-table save/navigation.
- **FR-004**: Invalid or partial values MUST show an inline cell-level error.
- **FR-005**: Item POST/PATCH validation MUST use the same normalization policy.

### Key Entities

- **TripItem time fields**: Existing `time_start` and `time_end` string fields stored as canonical `HH:MM`.
- **Time input policy**: Shared parser/normalizer for schedule table and item API.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `0800` and `8:00` save as `08:00`.
- **SC-002**: `01` does not issue a schedule-table save on Tab/Enter.
- **SC-003**: API validation accepts normalized compact time and rejects partial time with a helpful message.
