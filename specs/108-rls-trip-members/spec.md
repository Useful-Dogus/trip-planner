# Feature Specification: RLS + trip_members — 다중 사용자 데이터 모델

**Feature Branch**: `issue/108-rls-trip-members`
**Created**: 2026-05-19
**Status**: Draft
**Input**: GitHub Issue #108 — [auth] RLS + trip_members — 다중 사용자 데이터 모델

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 기존 사용자가 마이그레이션 후에도 자신의 데이터를 그대로 본다 (Priority: P1)

#107 으로 로그인 기능이 도입되었지만 현재 데이터는 사용자/여행 구분 없이 단일 풀에 들어있다. 다중 사용자 모델로 전환할 때 기존 단일 사용자(chanhee13p@gmail.com)의 모든 items 는 하나의 "내 여행" trip 으로 묶여 동일하게 보여야 한다.

**Why this priority**: 데이터 손실/오인 노출은 신뢰를 즉시 깬다. 마이그레이션 회귀가 없어야 후속 Phase 가 의미를 가진다.

**Independent Test**: 마이그레이션 SQL 실행 전후로 메인 화면 items 목록이 항목 수·내용 모두 동일하다는 것을 확인할 수 있다.

**Acceptance Scenarios**:

1. **Given** 마이그레이션 전 N 개의 items 가 있고, **When** 마이그레이션 SQL 을 적용한 뒤 chanhee13p@gmail.com 으로 로그인하면, **Then** 동일한 N 개의 items 가 동일 순서로 보인다.
2. **Given** 마이그레이션이 적용된 상태에서, **When** 사용자가 새 item 을 생성하면, **Then** 그 item 은 자동으로 "내 여행" trip 에 속한다.

---

### User Story 2 - 다른 사용자는 내 여행의 데이터를 볼 수 없다 (Priority: P1)

다중 사용자 전환의 핵심은 격리다. 다른 계정으로 로그인한 사용자는 내 trip 의 items / trip 자체 / 멤버 목록을 모두 조회할 수 없어야 한다. 권한 체크는 애플리케이션이 아니라 DB(RLS)에서 강제된다.

**Why this priority**: 격리 실패 = 보안 사고. 이 시점에 다른 모든 작업이 의미를 잃는다.

**Independent Test**: 두 번째 테스트 계정으로 가입·로그인하고 첫 사용자의 trip / items / trip_members 를 직접 쿼리하면 빈 결과만 반환된다.

**Acceptance Scenarios**:

1. **Given** 사용자 A 가 trip T 의 owner 이고, **When** 사용자 B 가 로그인해 items / trips / trip_members 를 조회하면, **Then** 결과에 T 와 T 의 items 는 포함되지 않는다.
2. **Given** 사용자 B 가 trip T 의 ID 를 알고 직접 명시해 조회를 시도해도, **When** B 가 T 의 멤버가 아니면, **Then** B 의 조회는 빈 결과를 반환한다.
3. **Given** 사용자 B 가 T 의 items 에 INSERT/UPDATE/DELETE 를 시도하면, **When** B 가 T 의 editor 이상 멤버가 아니면, **Then** DB 가 거부한다.

---

### User Story 3 - 새 가입자는 첫 로그인 시 빈 trip 을 갖는다 (Priority: P2)

신규 가입한 사용자가 앱에 진입했을 때 "여행이 하나도 없어 아무것도 할 수 없는 상태" 가 되지 않도록, 첫 진입 시 기본 trip 1 개와 owner 멤버십이 자동 생성된다.

**Why this priority**: 멀티-trip UX(#112) 가 도착하기 전까지의 단일-trip 사용성을 유지한다. P1 격리/마이그레이션이 깨지지 않는 한 후순위.

**Independent Test**: 신규 계정으로 가입 후 첫 화면에서 빈 items 리스트가 보이고, 항목 추가가 정상 동작한다.

**Acceptance Scenarios**:

1. **Given** 신규 가입자가 처음 로그인하면, **When** 메인 화면이 로드되면, **Then** 자동 생성된 기본 trip 이 활성화되어 있고 owner 멤버십이 존재한다.
2. **Given** 신규 가입자가 첫 item 을 추가하면, **When** 저장이 완료되면, **Then** item 은 자신의 기본 trip 에 속한다.

---

### Edge Cases

- 마이그레이션 시 chanhee13p@gmail.com 의 auth.users 엔트리가 아직 없는 환경(예: 새 Postgres 호스트로 이전)이라면 마이그레이션 스크립트는 **owner 후보가 없음을 보고하고 멈춰야** 한다. 임의 user 에 귀속시키지 않는다.
- 비로그인 상태에서 데이터 API 를 호출하면 RLS 가 빈 결과를 반환하고, 앱은 로그인 화면으로 유도한다(이미 #107 미들웨어가 처리).
- 한 사용자가 동시에 두 탭에서 다른 trip 으로 활성화를 시도하면, 마지막 활성화가 우선한다(서버 상태 기준).
- viewer 권한 멤버가 items 를 수정/삭제 시도하면 DB 가 거부하고, 클라이언트는 권한 오류를 사용자 친화적 메시지로 표시한다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST 모든 item 을 정확히 하나의 trip 에 귀속시킨다. trip_id 없는 item 은 존재할 수 없다.
- **FR-002**: System MUST 각 trip 에 대해 멤버십 레코드를 owner / editor / viewer 역할로 표현한다.
- **FR-003**: System MUST trip 에 속하지 않은 사용자가 그 trip 또는 trip 의 items / 멤버 목록을 읽지 못하도록 DB 레벨에서 강제한다.
- **FR-004**: System MUST editor 이상의 권한을 가진 멤버만 해당 trip 의 items 를 생성/수정/삭제할 수 있도록 DB 레벨에서 강제한다.
- **FR-005**: System MUST owner 만 trip 자체의 수정/삭제 및 멤버십 추가/수정/삭제를 할 수 있도록 DB 레벨에서 강제한다.
- **FR-006**: System MUST 새로 가입한 사용자가 첫 진입 시 자동으로 1 개의 기본 trip 과 그 trip 의 owner 멤버십을 갖도록 한다.
- **FR-007**: System MUST 기존 단일 사용자(chanhee13p@gmail.com)의 모든 items 를 단일 trip "내 여행" 으로 묶고 그 사용자를 owner 로 지정하는 일회성 마이그레이션을 제공한다.
- **FR-008**: System MUST 애플리케이션 호출부가 명시적인 trip 식별 없이도 "현재 활성 trip" 의 items 에만 접근하도록 한다(편의 계층). 단, 권한 강제는 식별 계층이 아닌 DB 의 책임이다.
- **FR-009**: System MUST 데이터 쿼리에 사용하는 자격증명을 사용자 세션 기반으로 바꿔, DB 의 RLS 가 실제로 평가되도록 한다. 권한 우회 자격증명(예: 서비스 키)으로 일반 CRUD 를 수행하지 않는다.
- **FR-010**: System MUST `chanhee13p@gmail.com` 의 사용자 식별자를 마이그레이션 시점에 자동 조회해 사용한다. 식별자가 발견되지 않으면 마이그레이션은 실패하고 데이터는 변경되지 않은 상태로 남는다.

### Non-Functional Requirements

- **NFR-001**: RLS 정책 정의는 단일 SQL 파일(`supabase/schema.sql`) 에 명시되어, 다른 Postgres 호스트에서도 동일하게 적용 가능해야 한다.
- **NFR-002**: 마이그레이션은 멱등하지 않아도 되지만(일회성), 부분 실패 시 데이터를 손상시키지 않는 트랜잭션 단위로 작성한다.
- **NFR-003**: 기존 호출부 변경은 호출 시그니처가 가능하면 그대로 유지되도록 한다. 명시적 trip_id 인자가 새로 강제되면 모든 호출부를 수정해야 하므로 회귀 위험이 커진다.

### Key Entities

- **Trip**: 한 번의 여행 단위. 메타데이터(title, 생성/수정 시각, owner)를 가지며 items 와 멤버를 보유한다. owner 식별자를 보조 컬럼으로 가져 트리거 없이 빠른 권한 평가에 활용한다.
- **TripMember**: (trip, user) 페어와 그 페어의 역할(owner/editor/viewer) 그리고 초대 시각. (trip_id, user_id) 가 자연 키.
- **Item**: 기존 엔티티에 trip 소속을 표현하는 trip_id 가 추가된다. trip_id 는 필수.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 마이그레이션 후 기존 단일 사용자가 보는 item 의 개수와 내용은 마이그레이션 전과 100% 동일하다.
- **SC-002**: 신규 가입자가 첫 로그인부터 item 1 개를 추가 완료하기까지 추가 설정 단계는 0 회다(기본 trip 자동 생성).
- **SC-003**: 두 번째 사용자가 첫 번째 사용자의 trip / items / 멤버 목록을 어떤 방식으로 조회해도 DB 가 반환하는 행 수는 0 이다.
- **SC-004**: 권한이 없는 멤버의 쓰기 시도(insert/update/delete)는 100% DB 레벨에서 거부된다.
- **SC-005**: 마이그레이션과 RLS 적용은 동일한 SQL 파일을 다른 Supabase/Postgres 인스턴스에서 재실행했을 때도 동일한 결과를 만들어낸다.

## Assumptions

- 현재 운영 환경은 단일 사용자(chanhee13p@gmail.com), 단일 trip 상태이다(사용자 확인 완료).
- 사용자 ID 발급은 Supabase Auth(`auth.users`) 에 위임한다(#107 에서 도입 완료). RLS 정책은 `auth.uid()` 를 신뢰한다.
- 익명/공유 접근은 본 스펙의 범위가 아니다(#110 에서 별도 정책).
- 초대/수락 UX·멀티 trip 전환 UX 는 본 스펙의 범위가 아니다(#112 에서 다룸). 본 스펙은 "기본 활성 trip" 개념만 도입한다.
- 다른 사용자가 자신의 데이터를 입력할 때까지는 격리 검증을 운영 데이터로 직접 수행할 수 없다. 격리 검증은 SQL Editor 에서 다른 user_id 를 시뮬레이션하거나 두 번째 테스트 계정을 만들어 수행한다.

## Out of Scope

- 멤버 초대/수락 UX
- 멀티 trip 전환 UX / 대시보드
- 공유 토큰을 통한 익명 접근(#110)
- 권한 변경 UI / 역할 승격
- 멤버십 알림 / 이메일
