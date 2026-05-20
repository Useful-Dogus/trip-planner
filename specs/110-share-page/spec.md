# Feature Specification: 공유 페이지 /share/{token}

**Feature Branch**: `110-share-page`
**Created**: 2026-05-20
**Status**: Draft
**Input**: GitHub Issue #113 — [multiuser] 공유 페이지 /share/{token}

## User Scenarios & Testing

### User Story 1 — 링크 받은 사람이 비로그인으로 일정을 본다 (Priority: P1)

카카오톡/슬랙으로 공유 링크를 받은 사람이 가입 없이 trip 일정을 모바일에서 둘러본다.

**Acceptance Scenarios**:
1. **Given** 유효 토큰 URL, **When** 비로그인 모바일 브라우저로 진입, **Then** trip 제목·기간·지역·아이템 목록이 표시된다.
2. **Given** 유효 토큰 URL, **When** 데스크탑 브라우저로 진입, **Then** 동일 내용이 가독성 있게 표시된다.
3. **Given** 페이지, **When** 어떤 아이템도 편집 컨트롤(편집 버튼/입력 패널/드래그 핸들)을 노출하지 않는다.

### User Story 2 — 만료/철회된 링크는 친절히 안내한다 (Priority: P1)

기간이 지났거나 회수된 토큰으로 들어오면 명확한 안내 페이지가 뜬다.

**Acceptance Scenarios**:
1. **Given** 만료/철회/존재하지 않는 토큰, **When** 진입, **Then** "공유 링크가 더 이상 유효하지 않습니다" 메시지와 발급자에게 재요청 안내 표시.
2. **Given** 안내 페이지, **When** 표시, **Then** 일정 데이터는 일절 노출되지 않는다.

### User Story 3 — 메신저 미리보기가 정상 표시된다 (Priority: P1)

링크를 메신저에 붙였을 때 trip 제목/요약이 OG 메타로 미리보기된다.

**Acceptance Scenarios**:
1. **Given** 유효 토큰 URL, **When** OG 메타 태그를 조회, **Then** `og:title`에 trip 이름, `og:description`에 `{기간} · {지역} · N일 일정` 형식, `og:image`가 포함된다.
2. **Given** 만료된 토큰 URL, **When** OG 메타 조회, **Then** 민감하지 않은 일반 OG (예: "이 링크는 더 이상 유효하지 않습니다") 가 표시된다.

### User Story 4 — owner가 공유 링크를 발급한다 (Priority: P2)

owner가 자신의 trip 화면에서 공유 링크 생성 버튼을 눌러 URL을 받는다.

**Acceptance Scenarios**:
1. **Given** trip owner, **When** "공유 링크 만들기" 버튼 클릭, **Then** 새 토큰이 발급되고 `/share/{token}` URL이 클립보드에 복사 가능한 형태로 표시된다.
2. **Given** owner, **When** 발급된 링크 목록에서 "회수"를 누름, **Then** 해당 링크가 즉시 무효화된다.

### User Story 5 — 익명 쓰기는 차단된다 (Priority: P1)

공유 페이지에서 어떤 방식으로도 데이터 수정이 일어나지 않는다.

**Acceptance Scenarios**:
1. **Given** 공유 페이지, **When** UI 검사, **Then** 편집/추가/삭제 컨트롤이 어떤 화면 크기에서도 노출되지 않는다.
2. **Given** 익명 클라이언트, **When** trips/items에 INSERT/UPDATE/DELETE 시도, **Then** #110의 RLS가 거부.

### User Story 6 — CTA로 가입을 부드럽게 권한다 (Priority: P3)

공유 페이지 하단에 "마음에 들면 직접 만들어보세요" CTA가 노출된다.

**Acceptance Scenarios**:
1. **Given** 공유 페이지, **When** 페이지 하단까지 스크롤, **Then** 가입 페이지로 가는 CTA 버튼이 노출된다.

### Edge Cases
- 동일 trip에 여러 유효 토큰 존재 → 어느 토큰으로 들어와도 동작.
- 토큰은 유효하나 trip이 삭제된 경우 → CASCADE로 share도 삭제 → "유효하지 않음" 안내.
- 토큰 URL 형식이 잘못된 경우(UUID 아님) → "유효하지 않음" 안내.
- items가 0건인 trip → 빈 상태 메시지 ("아직 추가된 일정이 없어요").
- 카카오톡 인앱 브라우저(WebView) 호환 → 표준 HTML/CSS만 사용, JS 의존도 최소.

## Requirements

### Functional Requirements

- **FR-001**: `/share/{token}` 경로는 비로그인 상태에서 접근 가능해야 한다(미들웨어 인증 보호 대상에서 제외).
- **FR-002**: 토큰이 유효하면 trip 메타데이터(제목, 기간, 지역, 베이스캠프)와 items 목록을 표시해야 한다.
- **FR-003**: 페이지는 읽기 전용으로, 편집/추가/삭제 컨트롤을 어떤 화면 크기에서도 노출하지 않아야 한다.
- **FR-004**: 토큰이 무효(존재하지 않음/만료/철회)이면 trip 데이터를 노출하지 않고 친절한 안내 페이지를 표시해야 한다.
- **FR-005**: 페이지는 OG 메타(`og:title`, `og:description`, `og:image`, `og:type`)를 응답에 포함해야 한다.
- **FR-006**: OG 설명은 기간·지역·아이템 수를 포함하는 일관된 포맷이어야 한다(없는 필드는 자연스럽게 생략).
- **FR-007**: OG 이미지는 첫 단계에선 사이트 기본 이미지/아이콘으로 대체할 수 있다(첫 장소 사진 자동 생성은 후속).
- **FR-008**: 모바일 우선 레이아웃(360-768px)에서 가독성·터치 영역이 충분해야 한다.
- **FR-009**: 데이터 페치는 단일 익명 호출로 trip + items를 원자적으로 받아와야 한다(RLS 세션 변수 race 회피).
- **FR-010**: owner는 자신의 trip 화면에서 공유 토큰을 발급·회수할 수 있는 UI에 접근할 수 있어야 한다.
- **FR-011**: 발급된 토큰 URL은 클립보드에 복사 가능한 형태로 노출되어야 한다.
- **FR-012**: 페이지 하단에 가입 페이지로 유도하는 CTA가 노출되어야 한다.

### Key Entities

- **Shared Trip View**: 토큰으로 노출되는 trip + items 스냅샷. 메타데이터(제목/기간/지역/베이스캠프) + items 배열.

## Success Criteria

- **SC-001**: 유효 토큰 URL의 첫 의미있는 페인트(FMP)가 모바일 4G에서 2.5초 이내.
- **SC-002**: 만료/철회/잘못된 토큰 시 trip 데이터 유출 0건.
- **SC-003**: OG 미리보기에 trip 이름이 100% 노출(카카오톡/슬랙/iMessage 수동 점검).
- **SC-004**: 공유 페이지 어디에서도 편집 컨트롤 노출 0건.
- **SC-005**: owner는 3 클릭 이내로 공유 링크를 발급하고 URL을 복사할 수 있다.

## Assumptions

- 익명 read는 #110에서 추가한 `set_share_token` + `share_token_grants_access` 조합 대신, **단일 RPC `get_shared_trip(token)`**으로 묶어 호출한다(PostgREST single-request-single-transaction 제약 해결). 본 이슈에서 RPC를 추가한다.
- OG 이미지는 첫 단계에서 사이트 기본 이미지(`/icon.svg` 기반 정적 이미지 또는 외부 generator) 사용. trip별 동적 OG 이미지 생성은 후속.
- "베이스캠프"는 `trips.basecamp_address` 컬럼(이미 존재) 사용.
- 모바일 메신저 인앱 브라우저(카카오톡 등) 호환을 위해 SSR 우선, 클라이언트 인터랙션 최소화.
- 토큰 URL 도메인은 배포 환경의 `NEXT_PUBLIC_SITE_URL`(없으면 요청 host) 사용.

## Dependencies

- 선행: #110 (shares 테이블 + RLS) — 머지됨.
- 후속: 동적 OG 이미지 생성, 비밀번호 보호 공유.

## Out of Scope

- 비밀번호 보호 공유
- 만료 알림 / 자동 갱신
- 공유 통계 / 조회 로그
- 지도 정적 스냅샷 자동 생성(첫 단계는 정적 OG 이미지)
- 공유 페이지 내 지도 (있으면 좋지만 본 PR에서는 아이템 카드 리스트만 포함; 후속으로 검토)
