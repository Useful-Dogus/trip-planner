# Feature Specification: Apollo Server + GraphQL 스키마 (code-first) 셋업

**Feature Branch**: `081-apollo-graphql`
**Created**: 2026-05-18
**Status**: Draft
**Input**: GitHub Issue #104 — [infra] Apollo Server + GraphQL 스키마 code-first 셋업
**Related Issue**: https://github.com/Useful-Dogus/trip-planner/issues/104

## 배경

현재 trip-planner 의 데이터 페치는 페이지마다 REST 엔드포인트 여러 개(SWR 병렬 호출)로 구성되어 있다. trip 트리(`trip → day → item → place`, `trip → lodging`)가 자원 단위로 쪼개져 있어 다음 문제가 누적된다.

- 워터폴 / N+1 — `items` 가져온 뒤 `google_place_id` 로 장소 메타데이터를 다시 조회하는 패턴이 페이지마다 변형 반복
- 자원 단위와 화면 단위가 불일치하여 fetch 코드가 페이지마다 길어짐
- 언더페치 / 오버페치 동시 발생 (지도에 필요 없는 `notes` 동봉, 일정 보드에 필요한 `durationMinutes` 누락 등)
- 신규 화면을 만들 때 같은 trip 을 4-5가지 모양으로 가져오는 코드 복제

이 스펙의 목표는 클라이언트가 화면이 필요한 모양 그대로 한 번에 요청할 수 있도록 GraphQL 게이트웨이를 도입하고, 첫 read-only 쿼리가 동작하며 N+1 이 발생하지 않는 패턴이 자리잡는 것이다. 기능 변경은 없다(추가형).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — 단일 쿼리로 trip 트리 가져오기 (Priority: P1)

프론트엔드 개발자(현재는 내부 개발자)가 trip 한 건의 전체 트리(day / item / place / lodging)를 한 번의 요청으로 가져올 수 있어야 한다.

**Why this priority**: 이 마일스톤의 다음 작업(#106 Apollo Client + 정규화 캐시, #111 인증 UI, #112 대시보드 등)은 모두 이 게이트웨이가 있어야 시작 가능하다. P1 이 만족되면 #104 이슈의 완료 조건 4개 중 3개가 충족된다.

**Independent Test**: GraphQL Playground (또는 동등한 도구)에서 `trip(id: "...")` 단일 쿼리를 실행해 day / item / place / lodging 필드가 모두 채워져 반환되는지 확인한다. 별도의 클라이언트 마이그레이션 없이 검증 가능하다.

**Acceptance Scenarios**:

1. **Given** 유효한 trip ID 와 그에 속한 day · item · place · lodging 데이터가 Supabase 에 존재, **When** GraphQL 엔드포인트로 `trip(id) { days { items { place { ... } } } lodgings { ... } }` 쿼리를 보낸다, **Then** 모든 중첩 필드가 한 응답에 포함되어 반환된다.
2. **Given** 존재하지 않는 trip ID, **When** 같은 쿼리를 보낸다, **Then** `trip` 이 `null` 로 반환되거나 표준 GraphQL 에러 형식으로 응답한다 (HTTP 200 유지).
3. **Given** 클라이언트가 day / item 중 일부 필드만 선택, **When** 쿼리를 보낸다, **Then** 선택한 필드만 반환되고 미선택 필드는 응답에 포함되지 않는다.

---

### User Story 2 — N+1 없이 트리 페치 (Priority: P1)

같은 trip 쿼리를 처리할 때 day → item → place 페치가 N+1 패턴 없이 배치(batch) 로 수행되어야 한다.

**Why this priority**: N+1 이 남아 있으면 화면당 SQL 수가 REST 시절과 동일하거나 더 많아져 GraphQL 도입의 핵심 이득이 사라진다. P1.

**Independent Test**: 단일 trip 쿼리 실행 중 발생한 Supabase / SQL 호출 수를 로그로 측정한다. 도메인 깊이(day 5개, item 50개, place 30개 가정)와 무관하게 호출 수가 `O(depth)` 수준(예: 도메인 4단계 - 4-6회 내)이어야 한다.

**Acceptance Scenarios**:

1. **Given** trip 1개에 day 5개, day 당 item 10개, item 절반에 place 가 연결됨, **When** 트리 전체를 가져오는 쿼리를 한 번 실행, **Then** Supabase 호출 횟수가 도메인 단계 수 × O(1) 수준으로 유지된다 (item 50개를 50번 조회하지 않는다).
2. **Given** 같은 쿼리를 동일 요청 내 두 번 참조(예: alias), **When** 실행, **Then** 동일 키 데이터는 캐시 / 배치로 인해 한 번만 페치된다.

---

### User Story 3 — 도메인 모델이 스키마의 단일 소스 (Priority: P2)

백엔드 개발자가 도메인 클래스(Trip / Day / Item / Lodging / Place)에 데코레이터로 필드를 선언하면, 그 정의가 GraphQL 스키마의 단일 소스가 되어야 한다 (별도 `.graphql` SDL 파일을 수기로 관리하지 않는다).

**Why this priority**: 스키마와 도메인이 분리되면 둘 사이 동기화 비용이 누적된다. code-first 가 이번 셋업의 채택 이유이므로 명시적으로 검증 대상이 된다.

**Independent Test**: 도메인 클래스 한 필드에 데코레이터를 추가/변경하고 서버 재기동 후, GraphQL introspection 결과 / Playground 자동완성에 즉시 반영되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 도메인 클래스에 신규 필드 데코레이터가 추가됨, **When** 서버 재기동, **Then** introspection 으로 해당 필드가 노출된다.
2. **Given** 스키마 SDL 파일이 별도 존재하지 않음, **When** 빌드 / 기동, **Then** 모든 타입 정의가 도메인 클래스 데코레이터에서 자동 생성된다.

---

### User Story 4 — 쿼리 비용 가시화 (Priority: P3)

운영자가 어떤 쿼리가 느린지, 어떤 리졸버가 비용을 많이 쓰는지 가시화할 수 있어야 한다 (예: Apollo Studio 트레이싱 또는 동등한 로컬 가시화).

**Why this priority**: 도입 직후엔 트래픽이 거의 없어 즉시 필요하진 않지만, 후속 이슈(#106 클라이언트 캐시, #110 공유 토큰)에서 비용 회귀를 잡으려면 베이스라인이 필요. P3.

**Independent Test**: 트레이싱이 활성화된 상태에서 임의 쿼리를 실행했을 때, 응답 메타데이터 또는 외부 대시보드에 리졸버별 latency 가 노출되는지 확인.

**Acceptance Scenarios**:

1. **Given** 트레이싱이 활성화, **When** trip 쿼리 실행, **Then** 리졸버 단위 / 필드 단위 latency 정보를 얻을 수 있다.

---

### Edge Cases

- **trip 에 day 가 0개**: 쿼리는 정상 응답하되 `days` 필드는 빈 배열로 반환.
- **item 에 `google_place_id` 가 없음**: 해당 item 의 `place` 필드는 `null` 로 반환 (에러로 처리하지 않는다).
- **lodging 이 0개**: `lodgings` 빈 배열 반환.
- **삭제된 / 권한 없는 trip ID**: 권한 모델은 #108 에서 들어오므로 이 이슈에서는 인증 컨텍스트 없이 정상 데이터를 반환한다 (기존 REST 와 동일 정책). 권한 필터는 후속 작업.
- **DataLoader 캐시 수명**: 요청 단위(per-request) 스코프. 요청 간 데이터 누수 없음.
- **REST 와의 공존**: 기존 REST 엔드포인트는 동작을 유지해야 하며, deprecation 마커(주석/응답 헤더 등 — Plan 에서 결정)만 추가한다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: API 서비스(`apps/api`)가 단일 GraphQL HTTP 엔드포인트를 노출해야 한다.
- **FR-002**: GraphQL 인터랙티브 탐색 도구(Playground / Sandbox 또는 동등물)가 개발 환경에서 접근 가능해야 한다.
- **FR-003**: `trip(id)` Query 가 day / item / place / lodging 까지 한 응답으로 반환해야 한다.
- **FR-004**: Day · Item · Lodging · Place 도메인 타입이 GraphQL 스키마에 노출되어야 하며, 정의 소스는 도메인 모델 클래스의 데코레이터여야 한다 (수기 SDL 파일 금지).
- **FR-005**: day → item → place 경로의 페치가 동일 요청 내 batch 로 수행되어 호출 수가 도메인 단계 수에 비례해야 한다 (item 수에 비례 금지).
- **FR-006**: 쿼리 트레이싱이 켜진 상태에서, 리졸버 단위 latency 가 응답 또는 외부 도구에서 확인 가능해야 한다.
- **FR-007**: 존재하지 않는 ID 에 대해서는 `null` 반환 또는 표준 GraphQL 에러 형식을 사용한다 (서버 500 금지).
- **FR-008**: 기존 REST 엔드포인트(`apps/web/app/api/**`)는 동작을 유지하면서 deprecation 표식(주석 또는 응답 헤더)을 가진다. 제거는 이 이슈에서 수행하지 않는다.
- **FR-009**: GraphQL 모듈이 기존 Supabase 통합(`SupabaseService`) 위에 얹혀 동작해야 한다 (별도 DB 연결 도입 금지).
- **FR-010**: 변이(Mutation), 인증, 권한, 클라이언트 측 적용은 이 이슈의 범위 밖이다 — Query 만 다룬다.

### Key Entities

- **Trip**: 여행 1건. ID, 제목, 시작일/종료일, day 목록, lodging 목록을 가진다.
- **Day**: trip 의 하루. 날짜 인덱스, 메모, item 목록을 가진다.
- **Item**: day 내부 활동/방문지. 시작시간, 종료시간(또는 duration), 메모, 우선순위, 선택적인 `google_place_id` 를 통해 Place 와 연결된다.
- **Lodging**: trip 의 숙박/베이스캠프. 시작일/종료일, 위치, 메모 등.
- **Place**: 외부(Google Places) 메타데이터 — 이름, 좌표, 카테고리, 사진 등. Item 0..N 이 같은 Place 를 참조 가능.

이 엔티티들은 이미 Supabase 스키마에 존재한다. 이번 작업은 새로운 데이터 모델을 만들지 않고 기존 모델 위에 GraphQL 레이어를 얹는다.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 단일 GraphQL 쿼리로 trip 의 day / item / place / lodging 까지 가져오는 데 성공한다 — REST 기준 4-5회 호출 → GraphQL 1회 호출로 감소.
- **SC-002**: trip 1개에 item 50개가 있을 때, 트리 페치 시 데이터 저장소 호출 수가 10회 이하로 유지된다 (도메인 단계 4 × 작은 상수).
- **SC-003**: 도메인 클래스에 필드 1개를 추가하면, SDL 파일을 별도로 수정하지 않고도 introspection 결과에 즉시 반영된다 (검증: 데코레이터만 수정한 커밋이 스키마 변경을 발생시킨다).
- **SC-004**: 기존 trip-planner 페이지(`/map`, `/list` 등) 의 동작이 회귀하지 않는다 — 기존 REST 경로가 그대로 200 응답.
- **SC-005**: 임의 쿼리 실행 후 리졸버 단위 latency 를 1분 이내에 확인할 수 있다 (대시보드 또는 응답 메타데이터).

## Assumptions

- 인증 / 권한은 이 이슈 범위 밖이며 후속 이슈(#107, #108, #110)에서 도입된다. 이번 셋업은 익명 컨텍스트로 동작한다.
- Mutation, Subscription 은 범위 밖. Query 만 다룬다.
- 클라이언트(apps/web) 의 SWR → Apollo Client 마이그레이션은 #106 의 범위. 이번 이슈에서는 클라이언트를 변경하지 않는다.
- Supabase 의 `items.google_place_id` 컬럼과 별도의 `places` 메타데이터 저장소 구조는 이미 존재한다고 가정한다. Place 가 별도 테이블이 아닌 외부 API 응답 캐시 형태라면 Plan 단계에서 어댑터 위치를 결정한다.
- REST 엔드포인트의 정확한 deprecation 표식 방식(주석 vs 응답 헤더 vs JSDoc) 은 Plan 단계에서 결정한다.
- 트레이싱은 우선 개발 환경에서 동작하면 충분하다. 운영 환경(Apollo Studio 외부 연동)은 후속 이슈에서 다룰 수 있다.

## Out of Scope

- Mutation / Subscription
- 인증 / 권한 / 멤버십 모델
- 클라이언트 측(apps/web) 의 GraphQL 채택 (#106 에서)
- 기존 REST 엔드포인트 제거 (별도 후속 이슈)
- 운영 환경 Apollo Studio Graph 등록 (별도 후속 이슈)
