# Feature Specification: Basecamp Role Clarification

**Feature Branch**: `tasks/issue-350-basecamp-role`
**Created**: 2026-06-30
**Status**: Draft
**Input**: GitHub issue #350 "새 여행 생성의 베이스캠프 필드 역할 재검토"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create A Trip Without Lodging Guesswork (Priority: P1)

A user creating a new trip is not asked for lodging or basecamp information before the trip exists.

**Why this priority**: New-trip creation should only ask for information that is immediately useful and clearly understood. Lodging can be unknown, multiple, or better modeled as schedule items.

**Independent Test**: Open the new trip wizard and confirm no step, summary row, draft state, or create request asks for `basecamp_address`.

**Acceptance Scenarios**:

1. **Given** a user opens the new trip wizard, **When** they move through all steps, **Then** the wizard asks for title, dates, region, currency, and confirmation only.
2. **Given** a user creates a trip, **When** the request is sent, **Then** the create payload does not include a lodging/basecamp field.

### User Story 2 - Keep A Narrow Map Reference Point (Priority: P2)

A user editing an existing trip can still set one optional map reference point, but the UI does not imply that this is the lodging model for the trip.

**Why this priority**: Existing `basecamp_address` behavior supports map fallback and marker display, but it is not enough to represent multiple hotels.

**Independent Test**: Open trip settings and confirm the field is described as a single map reference point, with multi-lodging guidance pointing to lodging schedule items.

**Acceptance Scenarios**:

1. **Given** a user opens trip settings, **When** they read the reference point field, **Then** the copy states that it is optional and single-value.
2. **Given** a user needs two lodgings, **When** they read the field help, **Then** they are directed to add lodging as trip items instead of overloading the trip setting.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: New trip creation MUST NOT ask for `basecamp_address`.
- **FR-002**: New trip drafts MUST NOT persist basecamp input.
- **FR-003**: New trip create requests MUST NOT send `basecamp_address`.
- **FR-004**: Existing trip settings MAY retain `basecamp_address`, but the UI MUST describe it as one optional map reference point, not as the trip's lodging model.
- **FR-005**: User-facing labels on map/share/settings surfaces MUST avoid implying that `basecamp_address` supports multiple lodgings.
- **FR-006**: Multi-lodging trips MUST be represented through lodging/stay schedule items, not by adding more trip-level fields in this change.

### Key Entities

- **Trip**: Existing travel container. `basecamp_address` remains an optional single string used as a map reference/fallback.
- **Item**: Existing place/schedule entry. Lodging is represented by stay/lodging category items when users need one or more accommodations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: New trip wizard source contains no basecamp input state, summary row, or create payload field.
- **SC-002**: Trip settings copy identifies the field as one optional map reference point and mentions lodging items for multiple accommodations.
- **SC-003**: No schema or API migration is required for this clarification.
