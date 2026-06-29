# Feature Specification: Trip Work Surface Width

**Feature Branch**: `tasks/issue-351-container-width`
**Created**: 2026-06-29
**Status**: Draft
**Input**: GitHub issue #351 "PC 목록/일정 화면 컨테이너 폭 규칙 정리"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Desktop Trip Views Share A Reading Width (Priority: P1)

A desktop user moving between the trip list and schedule views sees content aligned to the same centered work surface instead of each screen choosing a separate width.

**Why this priority**: The list and schedule are adjacent planning workflows, so inconsistent desktop widths make the product feel uneven.

**Independent Test**: Open the list and schedule routes on a desktop viewport and confirm their headers and primary table content share the same max width and horizontal alignment.

**Acceptance Scenarios**:

1. **Given** a desktop viewport, **When** the user opens the list route, **Then** the header controls and desktop table are centered inside the same bounded width.
2. **Given** a desktop viewport, **When** the user opens the schedule route, **Then** the header and schedule table use the same bounded width as the list route.

### User Story 2 - Map Remains A Spatial Canvas (Priority: P2)

A user opening the map view still gets the map-focused spatial layout rather than a reading-width table container.

**Why this priority**: Map interactions need available canvas area and should remain visually distinct from list-like work surfaces.

**Independent Test**: Open the map route and confirm it continues to render through `PlanScreen` without the shared list/schedule width wrapper.

**Acceptance Scenarios**:

1. **Given** the user opens the map route, **When** the screen loads, **Then** map layout behavior is unchanged.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: List and schedule desktop work surfaces MUST use one shared max-width rule.
- **FR-002**: List page header controls, unnamed-item warning, skeleton, and desktop table MUST align to that shared work surface.
- **FR-003**: Schedule page header, loading skeleton, and schedule table MUST align to that shared work surface.
- **FR-004**: Mobile list and schedule layouts MUST retain their existing full-width compact behavior.
- **FR-005**: Map route MUST NOT receive the shared reading/table width rule.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desktop list and schedule primary content use the same `max-width` source.
- **SC-002**: Map page source remains untouched by the shared work-surface helper.
