# Feature Specification: shares 테이블 + 익명 RLS 정책

**Feature Branch**: `109-shares-rls`
**Created**: 2026-05-20
**Status**: Draft
**Input**: GitHub Issue #110 — [share] shares 테이블 + 익명 RLS 정책

## User Scenarios & Testing

### User Story 1 — owner가 공유 토큰을 발급한다 (Priority: P1)

여행 소유자가 자신의 trip에 대해 공유 토큰을 발급하여, 가입하지 않은 친구에게도 일정을 보여줄 수 있다.

**Why this priority**: 마일스톤 1 Phase 5의 출발점. 토큰 발급 없이는 후속 공유 페이지(#113) 자체가 불가능하다.

**Independent Test**: 로그인한 owner가 helper를 호출해 토큰을 받고, 토큰이 저장소에 기록되었음을 확인하면 검증 가능.

**Acceptance Scenarios**:

1. **Given** 로그인한 trip owner, **When** 해당 trip에 대해 공유 토큰 발급을 요청, **Then** 새 토큰이 생성되고 owner가 토큰 값을 받는다.
2. **Given** owner가 아닌 멤버(editor/viewer), **When** 같은 trip에 대해 토큰 발급을 시도, **Then** 발급이 거부된다.
3. **Given** owner가 자신이 멤버가 아닌 다른 trip, **When** 토큰 발급을 시도, **Then** 거부된다.

---

### User Story 2 — 익명 사용자가 토큰으로 read-only 조회한다 (Priority: P1)

토큰을 가진 누구나(로그인 없이) 해당 trip의 일정·아이템·숙소를 읽을 수 있다.

**Why this priority**: 공유 가치 자체. 익명 조회가 안 되면 토큰을 발급해도 의미가 없다.

**Independent Test**: 익명 클라이언트로 token을 사용해 조회 → trip + items 데이터가 반환되는지 확인.

**Acceptance Scenarios**:

1. **Given** 유효한(만료/철회 안 됨) 토큰, **When** 익명 클라이언트가 토큰으로 trip을 조회, **Then** trip 메타데이터와 items 목록을 받는다.
2. **Given** 익명 클라이언트, **When** 토큰 없이 임의의 trip을 조회, **Then** 결과가 비어 있다(RLS가 차단).
3. **Given** 익명 클라이언트가 토큰을 가졌지만 다른 trip을 조회, **When** SELECT 요청, **Then** 결과가 비어 있다.

---

### User Story 3 — 만료/철회된 토큰은 거부된다 (Priority: P1)

`expires_at`이 지났거나 `revoked_at`이 채워진 토큰으로는 더 이상 데이터에 접근할 수 없다.

**Why this priority**: 공유 링크의 수명 제어가 없으면 사용자는 공유를 시작할 수 없다(되돌릴 수 없으므로).

**Independent Test**: 만료된 토큰·철회된 토큰 각각으로 trip 조회 → 빈 결과.

**Acceptance Scenarios**:

1. **Given** `expires_at < now()`인 토큰, **When** 익명 조회, **Then** trip/items 결과 비어 있음.
2. **Given** `revoked_at IS NOT NULL`인 토큰, **When** 익명 조회, **Then** 결과 비어 있음.
3. **Given** owner, **When** 자신이 발급한 토큰의 `revoked_at`을 채움, **Then** 즉시 익명 접근 차단.

---

### User Story 4 — 익명 사용자는 쓰기 작업이 차단된다 (Priority: P1)

토큰을 가진 익명 사용자라도 trip/items에 대한 INSERT/UPDATE/DELETE는 모두 거부된다.

**Why this priority**: read-only 공유의 핵심 안전장치. 위반 시 데이터가 손상될 수 있다.

**Independent Test**: 익명 클라이언트가 토큰을 들고 items에 INSERT/UPDATE/DELETE 시도 → 모두 거부.

**Acceptance Scenarios**:

1. **Given** 유효한 토큰을 가진 익명 클라이언트, **When** items INSERT 시도, **Then** RLS가 거부한다.
2. **Given** 유효한 토큰을 가진 익명 클라이언트, **When** trips UPDATE 시도, **Then** 거부.
3. **Given** 익명 클라이언트, **When** shares 테이블에 INSERT/DELETE 시도, **Then** 거부(owner만 가능).

---

### Edge Cases

- 동일 trip에 여러 토큰이 발급되어 있고 일부만 만료된 경우 → 만료되지 않은 토큰 중 하나라도 유효하면 익명 조회 허용.
- 토큰이 존재하지만 trip이 이미 삭제된 경우 → CASCADE로 shares도 함께 삭제되어 토큰이 자동 무효화.
- `expires_at = NULL`인 토큰 → 만료 없음(영구). `revoked_at`으로만 무효화 가능.
- owner가 trip의 owner 자격을 잃은(멤버에서 제거된) 경우 → 기존 토큰은 유효하게 유지(데이터 무결성 < 약속). 새 토큰 발급은 새 owner만 가능.
- 같은 토큰 값이 충돌할 가능성 → UUID v4 사용으로 무시 가능한 수준.

## Requirements

### Functional Requirements

- **FR-001**: 시스템은 `shares` 저장소에 토큰(UUID), trip 참조, 생성자, 생성 시각, 만료 시각(optional), 철회 시각(optional)을 기록할 수 있어야 한다.
- **FR-002**: trip의 owner 역할 멤버만 해당 trip에 대해 토큰을 발급할 수 있어야 한다.
- **FR-003**: trip의 owner 역할 멤버만 자신이 발급한 토큰을 철회(`revoked_at` 기록)할 수 있어야 한다.
- **FR-004**: 익명(비로그인) 요청도 토큰 값으로 정확히 1건을 lookup 할 수 있어야 한다(SELECT 허용).
- **FR-005**: 익명 요청은 `shares` 테이블에 INSERT/UPDATE/DELETE를 수행할 수 없어야 한다.
- **FR-006**: 유효한 토큰(만료 전 + 미철회)이 존재하는 trip은 익명 SELECT가 허용되어야 한다(trips, items, lodgings 존재 시).
- **FR-007**: 익명 요청은 trips/items/lodgings에 대한 INSERT/UPDATE/DELETE가 모두 차단되어야 한다.
- **FR-008**: 만료(`expires_at < now()`) 또는 철회(`revoked_at IS NOT NULL`)된 토큰은 익명 조회 자체를 더 이상 허용하지 않아야 한다.
- **FR-009**: 토큰이 부여하는 익명 접근 범위는 해당 trip과 그 하위 데이터(items, lodgings)로 한정되어야 한다(다른 trip이 노출되어서는 안 됨).
- **FR-010**: 기존 멤버(owner/editor/viewer)의 권한·정책은 본 변경으로 인해 영향받지 않아야 한다(회귀 금지).
- **FR-011**: trip이 삭제되면 해당 trip의 모든 토큰은 자동으로 무효화되어야 한다.
- **FR-012**: 애플리케이션은 토큰 발급 / 토큰으로 trip 조회 / 토큰 철회를 수행하는 헬퍼 인터페이스를 제공해야 한다.

### Key Entities

- **Share Token**: 익명 공유 접근을 부여하는 단일 자격증명.
  - 토큰 값(추측 불가능한 식별자), 대상 trip 참조, 생성한 사용자, 생성/만료/철회 시각.
  - 활성 조건: 철회되지 않았고, 만료 시각이 없거나 아직 도래하지 않음.

## Success Criteria

- **SC-001**: owner가 자신의 trip에 대해 토큰을 1회 발급하는 시도가 100% 성공한다.
- **SC-002**: 비-owner 멤버 및 다른 trip의 owner가 토큰 발급을 시도하면 100% 거부된다.
- **SC-003**: 유효한 토큰을 가진 익명 요청은 해당 trip의 메타데이터 + items 전체를 조회할 수 있다(빠짐 0건).
- **SC-004**: 토큰 없는 익명 요청 또는 만료/철회된 토큰의 익명 요청은 trip/items 조회 결과가 항상 0건이다.
- **SC-005**: 익명 요청의 INSERT/UPDATE/DELETE 시도는 trips, items, lodgings, shares 어디서도 성공하지 않는다(0건).
- **SC-006**: 본 변경 전후로 로그인한 멤버의 기존 trip CRUD 동작에 회귀가 발생하지 않는다.

## Assumptions

- 토큰은 추측 불가능한 UUID로 충분하며 추가 비밀번호 보호는 본 이슈 범위 밖이다(#110 Out of Scope).
- `lodgings` 테이블이 현재 스키마에 존재하지 않을 가능성이 있다. plan 단계에서 확인 후, 존재 시 items와 동일 패턴으로 RLS를 적용하고 부재 시 본 이슈에서 추가하지 않는다.
- 토큰 발급 직후 즉시 활성으로 간주한다(별도 활성화 단계 없음).
- 익명 SELECT는 Supabase의 `anon` 역할로 수행되며, 로그인 사용자(`authenticated`)와 자동 분리된다.
- 마일스톤 1의 기존 RLS 패턴(`is_trip_member`, `user_role_in_trip` SECURITY DEFINER 헬퍼)과 일관성을 유지한다.

## Dependencies

- 선행: #107 Supabase Auth, #108 RLS + trip_members (완료됨).
- 후속: #113 공유 페이지 `/share/{token}` — 본 이슈가 제공하는 토큰/RLS 위에서 UI 구현.

## Out of Scope

- 공유 페이지 UI / 라우트 (#113에서 처리)
- 비밀번호 보호 공유
- 만료 알림 / 자동 갱신
- 공유 통계 / 조회 로그
