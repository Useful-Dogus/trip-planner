# Feature Specification: 이미 로그인된 경우 /login 리다이렉트

**Feature Branch**: `002-login-redirect`
**Created**: 2026-03-24
**Status**: Draft
**Input**: User description: "이미 로그인된 경우 /login 리다이렉트"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 로그인 상태에서 /login 재접근 (Priority: P1)

이미 로그인된 사용자가 `/login` 경로에 직접 접근하면, 로그인 페이지 대신 메인 앱 화면(`/research`)으로 자동으로 이동된다.

**Why this priority**: 로그인 페이지를 다시 보여주는 것은 사용자 혼란을 야기하며, 이미 인증된 세션이 있는 사용자를 앱의 핵심 기능으로 빠르게 안내해야 한다.

**Independent Test**: 로그인 후 브라우저 주소창에 `/login`을 직접 입력했을 때 `/research`로 이동하는지 확인.

**Acceptance Scenarios**:

1. **Given** 사용자가 유효한 인증 쿠키를 가지고 있을 때, **When** `/login` 경로에 접근하면, **Then** `/research`로 자동 리다이렉트된다.
2. **Given** 사용자가 로그아웃 상태일 때, **When** `/login` 경로에 접근하면, **Then** 로그인 페이지가 정상적으로 표시된다.

---

### Edge Cases

- 인증 쿠키가 만료된 경우: 로그인 페이지를 정상적으로 표시한다.
- 인증 쿠키가 위변조된 경우: 로그인 페이지를 정상적으로 표시한다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 유효한 인증 세션이 있는 사용자가 `/login`에 접근하면 시스템은 `/research`로 자동 리다이렉트해야 한다.
- **FR-002**: 인증되지 않은 사용자(세션 없음, 만료, 위변조)는 로그인 페이지를 정상적으로 볼 수 있어야 한다.
- **FR-003**: 리다이렉트는 로그인 폼이 화면에 표시되기 전에 발생해야 한다.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 로그인된 사용자가 `/login`에 접근 시 100% `/research`로 리다이렉트된다.
- **SC-002**: 미인증 사용자의 `/login` 접근 시 로그인 페이지가 정상 표시된다.
- **SC-003**: 리다이렉트는 페이지 렌더링 없이 즉시 발생한다 (로그인 폼이 잠시라도 표시되지 않음).
