# Feature Specification: Signup Password Policy Alignment

**Feature Branch**: `tasks/issue-287-password-policy`
**Created**: 2026-06-29
**Status**: Draft
**Input**: GitHub issue #287 "비밀번호 강도·유출 비밀번호 차단"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Block Weak Signup Passwords (Priority: P1)

A new user cannot create an account with a password that the product itself labels as too weak.

**Why this priority**: The current signup path can show "매우 약함" while still allowing submission, which breaks trust and weakens account security.

**Independent Test**: Enter `123123123` on the signup form and confirm the form blocks submission before account creation; direct API signup must also reject it.

**Acceptance Scenarios**:

1. **Given** a signup password is very weak, **When** the user submits the form, **Then** signup is blocked with a clear message.
2. **Given** a direct API request uses the same weak password, **When** `/api/auth/signup` receives it, **Then** the API rejects it.

### User Story 2 - Prevent Password Typos (Priority: P2)

A new user confirms the password before signup so accidental typos do not silently become the account password.

**Why this priority**: The reopened issue specifically identifies the missing confirmation field as part of the same password-area defect.

**Independent Test**: Enter different password and confirmation values and confirm the form shows an inline mismatch message and does not submit.

**Acceptance Scenarios**:

1. **Given** password and confirmation differ, **When** the user attempts signup, **Then** signup is blocked and the mismatch is shown near the confirmation field.
2. **Given** password and confirmation match, **When** the password also passes policy, **Then** the signup request can proceed.

### User Story 3 - Avoid Strength Meter Layout Shift (Priority: P3)

The signup button does not move when the password strength meter finishes calculating.

**Why this priority**: The issue reports CLS in the same signup password area.

**Independent Test**: Focus the password field, type a password, and confirm the strength meter area keeps stable height before and after the async score resolves.

**Acceptance Scenarios**:

1. **Given** the signup form is visible, **When** the user starts typing a password, **Then** the strength meter does not push the submit button down after async loading.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Signup client validation MUST block passwords below the accepted strength threshold.
- **FR-002**: Signup API validation MUST enforce the same minimum password policy as the client.
- **FR-003**: Common password blocking MUST remain enforced server-side.
- **FR-004**: Signup MUST include password confirmation and block mismatches before calling the API.
- **FR-005**: Password strength meter layout MUST reserve stable vertical space.

### Key Entities

- **Password policy**: Shared rule set for minimum length, common password blocking, and minimum zxcvbn score.
- **Signup form**: Client form collecting email, password, and confirmation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `123123123` is rejected by the signup form and `/api/auth/signup`.
- **SC-002**: Mismatched password confirmation prevents signup.
- **SC-003**: The signup button position is stable while password strength is calculated.
