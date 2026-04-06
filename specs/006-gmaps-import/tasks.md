# Tasks: 구글맵 장소 가져오기

**Input**: Design documents from `/specs/006-gmaps-import/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/api.md ✓

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 의존성 설치 및 디렉토리 구조 생성

- [x] T001 `fuse.js` 패키지를 `package.json`에 추가하고 `npm install` 실행
- [x] T002 [P] `services/gmaps/` 디렉토리 구조 생성 (resolver.ts, fetcher.ts, parser.ts, categoryMap.ts, matcher.ts 빈 파일)
- [x] T003 [P] `app/gmaps-import/` 페이지 디렉토리 및 `components/GmapsImport/` 컴포넌트 디렉토리 생성

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 유저 스토리가 의존하는 핵심 인프라

**⚠️ CRITICAL**: 이 단계 완료 전 유저 스토리 구현 불가

- [x] T004 `supabase/schema.sql`에 `google_place_id TEXT` 컬럼 추가 SQL 반영 및 Supabase에 마이그레이션 적용
- [x] T005 [P] `types/index.ts`에 `GooglePlace`, `ImportStatus`, `ImportCandidate` 타입 추가 및 `TripItem`에 `google_place_id?: string | null` 필드 추가
- [x] T006 [P] `lib/data.ts`에서 `google_place_id` 필드를 읽기/쓰기에 포함하도록 수정 (readItems row 매핑 + writeItems upsert)
- [x] T007 `middleware.ts`에 `/gmaps-import` 경로에 대한 인증 보호 추가

**Checkpoint**: Foundation 완료 — 유저 스토리 구현 시작 가능

---

## Phase 3: User Story 1 - 구글맵 리스트 URL로 장소 목록 불러오기 (Priority: P1) 🎯 MVP

**Goal**: Short URL 입력 → 장소 목록 화면 표시

**Independent Test**: `maps.app.goo.gl` URL을 `/api/gmaps/preview`에 POST하면 `candidates` 배열을 포함한 응답이 반환된다.

### Implementation for User Story 1

- [x] T008 [US1] `services/gmaps/resolver.ts` 구현: `maps.app.goo.gl` short URL → HTTP redirect 추적 → 구글맵 full URL 반환, list ID 추출 (URL에서 `/placelists/list/` 뒤 segment)
- [x] T009 [US1] `services/gmaps/fetcher.ts` 구현: list ID로 `https://www.google.com/maps/placelists/list/[listId]` 페이지 fetch (User-Agent 헤더 포함, 5초 AbortController timeout)
- [x] T010 [US1] `services/gmaps/parser.ts` 구현: 응답 HTML에서 `)]}'\n` 접두사 JSON 데이터 추출, 장소별 name/address/lat/lng/googlePlaceId/googleCategory를 `GooglePlace[]`로 파싱, 파싱 실패 시 `PARSE_ERROR` throw
- [x] T011 [P] [US1] `services/gmaps/categoryMap.ts` 구현: 구글 place types → 앱 9개 카테고리 룩업 테이블 (research.md의 매핑 테이블 기반, 없는 경우 "기타" 반환)
- [x] T012 [US1] `app/api/gmaps/preview/route.ts` 구현: POST 라우트 — URL 유효성 검사 → resolver → fetcher → parser → `candidates` 반환 (이 단계에서는 모든 장소를 `status: 'new'`로 반환), 오류 코드 `INVALID_URL` / `PRIVATE_LIST` / `PARSE_ERROR` / `NETWORK_ERROR` 처리
- [x] T013 [P] [US1] `components/GmapsImport/UrlInput.tsx` 구현: URL 입력 폼 컴포넌트 (입력 필드, "불러오기" 버튼, 로딩 상태, 오류 메시지 표시)
- [x] T014 [US1] `app/gmaps-import/page.tsx` 구현 (Phase 1): `idle` → `loading` → `error` 상태 관리, `UrlInput` 렌더링, `/api/gmaps/preview` 호출

**Checkpoint**: URL 입력 → 장소 목록(신규만) 표시 동작 확인

---

## Phase 4: User Story 2 + 3 - 신규/유사/중복 구분 및 선택적 추가 (Priority: P2/P3)

**Goal**: 중복 감지 + 검토 화면 + 선택 INSERT

**Independent Test**: DB에 일부 장소가 있는 상태에서 preview를 호출하면 중복/유사/신규가 올바르게 분류되고, import를 호출하면 선택된 항목만 DB에 삽입된다.

### Implementation for User Story 2/3

- [x] T015 [US2] `services/gmaps/matcher.ts` 구현: `ImportCandidate[]` 생성 로직 — 1차: `google_place_id` 완전 일치 → `duplicate`, 2차: fuse.js 이름 유사도 ≥ 0.65 → `similar` (유사 항목명 포함), 그 외 → `new`, 기본 `selected` 값 설정
- [x] T016 [US2] `app/api/gmaps/preview/route.ts` 수정: T015의 matcher를 통합하여 기존 items와 비교 후 분류된 `ImportCandidate[]` 반환
- [x] T017 [US2] `app/api/gmaps/import/route.ts` 구현: POST 라우트 — `GooglePlace[]` 수신 → `TripItem`으로 변환 (status: "검토중", priority: null, google_place_id 포함) → Supabase INSERT, 삽입 수 반환
- [x] T018 [P] [US2] `components/GmapsImport/CandidateList.tsx` 구현: 검토 화면 컴포넌트 — 각 항목 체크박스 (duplicate는 disabled), status별 배지 (신규/유사/이미 추가됨), 유사 장소명 경고 표시, "추가" 버튼
- [x] T019 [US2] `app/gmaps-import/page.tsx` 수정 (Phase 2): `review` → `importing` → `done` 상태 추가, `CandidateList` 통합, `/api/gmaps/import` 호출, "N개 장소가 추가되었습니다" 완료 메시지

**Checkpoint**: 중복 감지 + 선택적 추가 전체 흐름 동작 확인

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 내비게이션 연동 및 엣지 케이스 처리

- [x] T020 `components/Layout/Navigation.tsx`에 "구글맵 연동" 메뉴 항목 추가 (`/gmaps-import` 링크)
- [x] T021 [P] 엣지 케이스 처리: 장소 0개 시 안내 메시지, 응답 구조 파싱 실패 명확한 오류 메시지, 50개 이상 스크롤 처리 확인
- [x] T022 [P] `app/api/gmaps/preview/route.ts` 및 `app/api/gmaps/import/route.ts` 인증 미들웨어 동작 최종 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 시작, 모든 유저 스토리를 블로킹
- **User Stories (Phase 3-4)**: Foundational 완료 후 시작
- **Polish (Phase 5)**: Phase 3-4 완료 후

### Within Each Phase

- T008 (resolver) → T009 (fetcher) → T010 (parser) → T012 (API route) 순서 의존
- T015 (matcher) → T016 (API route 수정) 의존
- T011, T013은 병렬 실행 가능
- T018 (CandidateList)은 T016 완료 후 통합

### Parallel Opportunities

```bash
# Phase 2 병렬 실행:
T005: types/index.ts 업데이트
T006: lib/data.ts 업데이트

# Phase 3 병렬 실행 (T010 완료 후):
T011: categoryMap.ts 구현
T013: UrlInput.tsx 구현

# Phase 4 병렬 실행 (T015 완료 후):
T017: import route 구현
T018: CandidateList.tsx 구현
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup (T001-T003)
2. Phase 2: Foundational (T004-T007)
3. Phase 3: User Story 1 (T008-T014)
4. **STOP and VALIDATE**: URL 입력 → 장소 목록 표시 확인
5. 동작 확인 후 Phase 4로 진행

### Incremental Delivery

1. Setup + Foundational → 인프라 준비
2. Phase 3 완료 → URL에서 장소 목록 표시 (MVP)
3. Phase 4 완료 → 중복 감지 + 선택적 추가
4. Phase 5 완료 → 내비게이션 연동 + 엣지 케이스

---

## Notes

- 총 22개 태스크
- US1: 7개 태스크 (T008-T014)
- US2/US3: 5개 태스크 (T015-T019)
- Foundational: 4개 태스크 (T004-T007)
- 구글맵 파싱은 비공식 API 기반 — 실제 테스트 시 파싱 로직 조정 필요
- fuse.js threshold 0.35 기본값, 실제 테스트 후 조정 권장
