# Feature Specification: Schedule Date Change Controls

**Feature Branch**: `tasks/issue-356-date-change-controls`
**Created**: 2026-06-29
**Status**: Draft
**Input**: GitHub issue #356 "일정 뷰 날짜 변경 컨트롤의 모바일/PC 조작성 개선"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mobile Date Change Without Drag Conflict (Priority: P1)

A mobile user can scroll the schedule without accidentally starting item drag, and can still change an item's date through an explicit control.

**Why this priority**: Mobile scroll conflict blocks a daily schedule browsing/editing path.

**Independent Test**: On mobile schedule cards, scroll vertically and confirm no item drag starts; tap the visible date control to open date selection.

**Acceptance Scenarios**:

1. **Given** a mobile schedule card, **When** the user scrolls the list, **Then** the card does not register a drag handle gesture.
2. **Given** a mobile schedule card, **When** the user taps "날짜", **Then** the native date picker opens.

### User Story 2 - Desktop Date Control Is Discoverable (Priority: P2)

A desktop user can find the date-change control without relying on row hover.

**Why this priority**: The previous icon-only hover affordance was easy to miss.

**Independent Test**: Open the desktop schedule table and confirm each row has a visible labeled date control.

**Acceptance Scenarios**:

1. **Given** a desktop schedule row, **When** the row is not hovered, **Then** the date-change control remains visible.
2. **Given** a desktop schedule row, **When** the user clicks the date control, **Then** the native date picker opens.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Mobile schedule cards MUST NOT register draggable item handles.
- **FR-002**: Mobile schedule cards MUST expose an always-visible date-change control.
- **FR-003**: Desktop rows MUST keep drag-and-drop behavior.
- **FR-004**: Desktop rows MUST expose an always-visible labeled date-change control.
- **FR-005**: Date picker min/max MUST keep using trip start/end bounds.

### Key Entities

- **TripItem date**: Existing `date` field updated through `onUpdateItem`.
- **Date change control**: Native date input trigger for mobile and desktop schedule rows.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Mobile schedule scrolling does not start drag.
- **SC-002**: Mobile and desktop both show a date-change control without hover.
- **SC-003**: Changing date still uses the existing item update path.
