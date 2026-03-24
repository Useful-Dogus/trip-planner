# Tasks: NYC Trip Planner MVP

**Input**: Design documents from `/specs/001-trip-planner-mvp/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/api.md ✅
**Tests**: 해당 없음 (개인 여행 도구)

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 해당 유저 스토리 (US1~US7)

---

## Phase 1: Setup (프로젝트 초기화)

**Purpose**: 빈 레포에서 실행 가능한 Next.js 프로젝트 골격 구성

- [X] T001 `create-next-app`으로 Next.js 14 + TypeScript + Tailwind CSS + App Router 프로젝트 초기화 (레포 루트)
- [X] T002 추가 의존성 설치: `react-leaflet leaflet jose uuid` / dev: `@types/leaflet @types/uuid`
- [X] T003 [P] 소스 폴더 구조 생성: `components/Map` `components/Items` `components/UI` `components/Layout` `lib` `types` `data`
- [X] T004 [P] `types/index.ts` 생성 — `TripItem`, `Link`, `Category`, `Status`, `Priority` 타입 정의 (data-model.md 기준)
- [X] T005 [P] `data/items.json` 초기 샘플 데이터 생성 — 카테고리 6종·상태 5종·우선순위 3종 조합 포함, 좌표 있는 항목·확정+날짜 항목·탈락 항목 포함한 15개 항목 (data-model.md 스키마 기준, 뉴욕 실제 장소명 사용)
- [X] T006 [P] `.env.example` 생성 — `AUTH_ID`, `AUTH_PASSWORD`, `JWT_SECRET` 변수 포함
- [X] T007 `app/layout.tsx` 설정 — `leaflet/dist/leaflet.css` import, `<html lang="ko">`, 기본 body 스타일 (`bg-gray-50 text-gray-900`)

**Checkpoint**: `npm run dev` 실행 후 `http://localhost:3000` 접속 확인

---

## Phase 2: Foundational (공통 인프라)

**Purpose**: 모든 유저 스토리에 앞서 완성해야 하는 공유 레이어

⚠️ **이 페이즈 완료 전까지 유저 스토리 작업 시작 불가**

- [X] T008 `lib/data.ts` 구현 — `readItems(): Promise<TripItem[]>`, `writeItems(items: TripItem[]): Promise<void>` (원자적 쓰기: `data/items.json.tmp` 에 쓰고 `fs.promises.rename`)
- [X] T009 `lib/auth.ts` 구현 — `createToken(payload)`, `verifyToken(token)` (jose HS256, `process.env.JWT_SECRET`)
- [X] T010 `lib/geocode.ts` 구현 — `geocodeAddress(q: string): Promise<{lat: number, lng: number} | null>` (Nominatim, `User-Agent` 헤더 포함)
- [X] T011 `middleware.ts` 구현 — `/research`, `/schedule`, `/items` 경로에 대해 `auth` 쿠키 JWT 검증, 실패 시 `/login` 리다이렉트
- [X] T012 `components/Layout/Navigation.tsx` 구현 — 모바일: 하단 고정 탭 (`리서치 / 일정 / + 추가`), 데스크탑: 좌측 사이드바, 로그아웃 버튼 포함 (POST `/api/auth/logout` 호출 후 `/login` 이동)

**Checkpoint**: `middleware.ts` 적용 후 `/research` 직접 접근 시 `/login` 리다이렉트 확인

---

## Phase 3: User Story 1 — 로그인 및 세션 유지 (Priority: P1) 🎯

**Goal**: 하드코딩 계정으로 로그인 → 세션 유지 → 로그아웃

**Independent Test**: 올바른 ID/PW로 로그인 후 `/research` 접근 가능 / 잘못된 자격증명 시 오류 표시 / 로그아웃 후 `/login` 리다이렉트

- [X] T013 [US1] `app/api/auth/login/route.ts` 구현 — `POST`: `AUTH_ID`·`AUTH_PASSWORD` 환경변수 비교, 일치 시 `createToken` 호출 후 `auth` httpOnly 쿠키 설정 (7일), 불일치 시 401
- [X] T014 [US1] `app/api/auth/logout/route.ts` 구현 — `POST`: `auth` 쿠키 만료 (maxAge: 0)
- [X] T015 [US1] `app/login/page.tsx` 구현 — ID/PW 입력 폼, 로그인 버튼, 오류 메시지 표시 (`자격증명이 올바르지 않습니다.`), 성공 시 `/research` 리다이렉트, `Navigation` 미포함

**Checkpoint**: 로그인 성공 → `/research` 이동 / 오류 메시지 / 로그아웃 → `/login` 이동 모두 확인

---

## Phase 4: User Story 2 — 여행 항목 추가 (Priority: P1)

**Goal**: `/items/new` 에서 항목을 생성하고 리서치 목록에서 확인

**Independent Test**: 이름·카테고리·상태 입력 후 저장 → `data/items.json`에 항목 추가 확인 / 주소 입력 시 lat·lng 자동 채워짐 / 필수 필드 누락 시 오류 메시지

- [X] T016 [US2] `app/api/items/route.ts` 구현 — `GET`: `readItems()` 전체 반환 / `POST`: 요청 바디 유효성 검사 (name·category·status 필수, 열거형 검증), UUID 생성, `created_at`·`updated_at` 서버 설정, `writeItems()` 저장 후 201 반환
- [X] T017 [US2] `app/api/geocode/route.ts` 구현 — `GET ?q=주소`: `geocodeAddress()` 호출, 결과 `{lat, lng}` 반환 (실패 시 `{lat: null, lng: null}`)
- [X] T018 [US2] `components/Items/ItemForm.tsx` 구현 — 추가/수정 공용 폼 컴포넌트. 필드: 이름(필수)·카테고리(필수)·상태(필수)·우선순위·주소·예산·메모·날짜·시작시간·링크(동적 추가/삭제). 상태·우선순위 셀렉트는 옵션 열면 설명 텍스트 함께 표시 (예: "확정 — 간다"). 주소 입력 후 포커스 아웃(onBlur) 시 `/api/geocode` 자동 호출하여 lat·lng 필드 자동 채우기. 링크: `+ 링크 추가` 버튼으로 label+URL 행 동적 추가. `mode: 'create' | 'edit'` props
- [X] T019 [US2] `app/items/new/page.tsx` 구현 — `ItemForm` mode=create 연결, 저장 성공 시 `/research` 리다이렉트

**Checkpoint**: `/items/new` 에서 항목 저장 → `data/items.json` 직접 열어 항목 추가 확인 / 주소 입력 시 lat·lng 자동 입력 확인

---

## Phase 5: User Story 3 — 항목 수정 및 삭제 (Priority: P1)

**Goal**: 기존 항목 수정 (상태 변경 포함) 및 삭제

**Independent Test**: 항목 상태를 "검토중" → "확정"으로 수정 후 `data/items.json` 변경 확인 / 삭제 확인 후 JSON에서 제거 확인

- [X] T020 [US3] `app/api/items/[id]/route.ts` 구현 — `GET`: id로 항목 조회, 없으면 404 / `PUT`: partial merge + `updated_at` 갱신 + 유효성 검사 + `writeItems()` / `DELETE`: 배열에서 제거 + `writeItems()`
- [X] T021 [US3] `app/items/[id]/page.tsx` 구현 — GET으로 항목 로드 후 `ItemForm` mode=edit 연결, 저장 성공 시 `/research` 리다이렉트, 삭제 버튼 클릭 시 확인 다이얼로그 표시 후 DELETE 호출 → `/research` 리다이렉트

**Checkpoint**: 항목 수정 저장 → 목록 반영 / 상태 "확정"·날짜 입력 후 저장 → 추후 일정 뷰에서 보일 것 예상 / 삭제 확인

---

## Phase 6: User Story 4 — 리서치 뷰: 목록 조회 및 필터링 (Priority: P2)

**Goal**: `/research` 목록 탭에서 전체 항목 조회 및 카테고리·상태·우선순위 필터링

**Independent Test**: 여러 항목 등록 후 카테고리 "식당" 필터 적용 → 식당 항목만 표시 / 항목 클릭 → `/items/[id]` 이동

- [X] T022 [P] [US4] `components/UI/StatusBadge.tsx` 구현 — data-model.md 배지 색상 적용 (배경 100 + 텍스트 700 조합 pill 스타일)
- [X] T023 [P] [US4] `components/UI/PriorityBadge.tsx` 구현 — data-model.md 배지 색상 적용
- [X] T024 [US4] `components/Items/ItemCard.tsx` 구현 — 카테고리 컬러닷(data-model.md 색상), 이름(굵게), StatusBadge·PriorityBadge, 날짜·시간·예산(gray-500 소형 텍스트). 클릭 시 `/items/[id]` 이동
- [X] T025 [US4] `components/Items/ItemList.tsx` 구현 — 카테고리·상태·우선순위 멀티 셀렉트 필터 UI, 필터 조합 적용 로직, ItemCard 목록 렌더링
- [X] T026 [US4] `app/research/page.tsx` 구현 — Navigation 포함, 탭 스위처 `[목록] [지도]` (초기: 목록 탭 활성), GET `/api/items` 호출 후 ItemList 렌더링

**Checkpoint**: 15개 샘플 항목이 목록에 표시 / 카테고리·상태·우선순위 필터 조합 동작 확인

---

## Phase 7: User Story 5 — 리서치 뷰: 지도 조회 (Priority: P2)

**Goal**: 리서치 지도 탭에서 탈락 제외 전체 핀 표시, 카테고리별 색상, 클릭 팝업

**Independent Test**: 지도 탭 전환 시 좌표 있는 항목 핀 표시 / 핀 색상이 카테고리별로 다름 / 핀 클릭 시 팝업 표시

- [X] T027 [US5] `components/Map/ResearchMap.tsx` 구현 — `next/dynamic` ssr:false 래퍼 패턴 사용. `status !== '탈락'` AND `lat·lng 존재` 항목만 핀 표시. 카테고리별 `L.divIcon` 원형 마커(data-model.md 색상 #hex). 핀 클릭 시 Leaflet Popup: 이름·카테고리·상태·우선순위 표시. 초기 뷰: 뉴욕 센터 `[40.7128, -74.0060]` zoom 13
- [X] T028 [US5] `app/research/page.tsx` 지도 탭 추가 — 탭 스위처에서 `[지도]` 선택 시 ResearchMap 렌더링, 현재 필터 상태 유지

**Checkpoint**: 지도 탭 전환 → 좌표 있는 샘플 항목 핀 표시 / 탈락 항목 핀 미표시 / 카테고리별 색상 확인 / 핀 클릭 팝업 확인

---

## Phase 8: User Story 6 — 일정 뷰: 날짜별 목록 조회 (Priority: P3)

**Goal**: `/schedule` 목록 탭에서 확정+날짜 항목을 날짜별 그룹·시간순 정렬로 표시

**Independent Test**: 확정+날짜 항목 여러 개 등록 후 일정 목록에서 날짜별 그룹 및 시간순 정렬 확인

- [X] T029 [US6] `app/schedule/page.tsx` 일정 목록 탭 구현 — Navigation 포함, 탭 스위처 `[목록] [지도]`. GET `/api/items` 후 `status === '확정' && date !== undefined` 필터. 날짜 오름차순 그룹화, 그룹 내 `time_start` 오름차순 정렬 (time_start 없는 항목은 그룹 마지막). 날짜 헤더 + ItemCard 목록 렌더링

**Checkpoint**: 샘플 데이터에서 확정+날짜 항목이 날짜별 그룹으로 표시 / 시간순 정렬 확인

---

## Phase 9: User Story 7 — 일정 뷰: 날짜별 지도 동선 확인 (Priority: P3)

**Goal**: 일정 지도에서 날짜 선택 → 번호 핀 + 방문 순서 연결선 표시

**Independent Test**: 특정 날짜에 확정 항목 3개 등록 → 지도에서 해당 날짜 선택 시 번호 핀 3개와 연결선 표시

- [X] T030 [US7] `components/Map/ScheduleMap.tsx` 구현 — `next/dynamic` ssr:false. 상단 날짜 칩 가로 스크롤 (확정 항목의 고유 날짜 목록). 선택된 날짜의 `lat·lng 있는 확정 항목`을 `time_start` 오름차순으로 정렬. 번호 `L.divIcon` 마커(1, 2, 3...). Leaflet `Polyline`으로 핀 순서대로 동선 연결 (color: `#94A3B8`, weight: 2)
- [X] T031 [US7] `app/schedule/page.tsx` 지도 탭 추가 — 탭 스위처에서 `[지도]` 선택 시 ScheduleMap 렌더링

**Checkpoint**: 일정 지도에서 날짜 선택 → 번호 핀 + 연결선 표시 / 날짜 변경 시 지도 업데이트 확인

---

## Phase 10: Polish & Cross-Cutting

**Purpose**: 반응형·사용성·완성도 점검

- [X] T032 [P] 반응형 레이아웃 점검 — iOS Safari에서 하단 탭 네비게이션이 가려지지 않도록 `pb-safe` 또는 `env(safe-area-inset-bottom)` 적용. 지도 영역에 `touch-action: none` 설정하여 페이지 스크롤과 지도 스크롤 충돌 방지
- [X] T033 [P] 상태·우선순위 셀렉트 설명 텍스트 검증 — `ItemForm.tsx`에서 각 옵션에 설명이 표시되는지 확인 (검토중: "아직 결정 안 됨", 보류: "나중에 다시 볼 것" 등 data-model.md 상태 정의 기준)
- [X] T034 [P] `app/login/page.tsx` — 이미 로그인된 사용자가 접근하면 `/research` 로 리다이렉트 처리
- [ ] T035 `quickstart.md` 기준으로 최종 동작 확인 — `npm run dev` → ngrok 연결 → 아이폰 Safari 접속 → 로그인·항목추가·지도조회 전체 흐름 수동 검증

---

## Dependencies & Execution Order

### Phase 의존 관계

- **Phase 1 (Setup)**: 의존 없음 — 즉시 시작 가능
- **Phase 2 (Foundational)**: Phase 1 완료 후 시작 — **모든 유저 스토리 블로킹**
- **Phase 3~9 (User Stories)**: Phase 2 완료 후 시작 가능
  - P1 스토리 (US1, US2, US3)는 순서대로 진행 권장 (US1 로그인 없이는 나머지 테스트 불가)
  - P2 스토리 (US4, US5)는 US3 완료 후 시작
  - P3 스토리 (US6, US7)는 US4 완료 후 시작
- **Phase 10 (Polish)**: 원하는 스토리 완료 후

### User Story 내부 순서

```
T016 (API) → T017 (지오코딩 API) → T018 (Form 컴포넌트) → T019 (페이지)
T020 (API) → T021 (페이지)
T022, T023 병렬 → T024 (Card) → T025 (List) → T026 (Page)
T027 (Map) → T028 (Page에 탭 추가)
```

---

## Parallel Opportunities

```
# Phase 1 — 동시 실행 가능
T003 폴더 구조 생성
T004 types/index.ts
T005 data/items.json 샘플 데이터
T006 .env.example

# Phase 6 — 동시 실행 가능
T022 StatusBadge.tsx
T023 PriorityBadge.tsx

# Phase 10 — 동시 실행 가능
T032 반응형 점검
T033 셀렉트 설명 검증
T034 로그인 리다이렉트
```

---

## Implementation Strategy

### MVP First (P1 스토리만)

1. Phase 1 Setup → Phase 2 Foundational
2. Phase 3 (US1): 로그인 동작 확인
3. Phase 4 (US2): 항목 추가 동작 확인
4. Phase 5 (US3): 항목 수정/삭제 동작 확인
5. **여기서 멈추고 검증**: JSON에 데이터 쌓이는지, 아이폰에서 접속되는지

### Full MVP (모든 스토리)

위 P1 완료 후 순서대로 P2 → P3 진행

---

## Notes

- 테스트 코드 없음 (개인 여행 도구)
- `data/items.json`은 `.gitignore` 제외 대상 — 반드시 Git 추적 유지
- Leaflet SSR 이슈: `Map` 컴포넌트는 항상 `next/dynamic + ssr: false` 패턴 사용
- `[P]` 표시 태스크는 다른 파일을 수정하므로 병렬 실행 안전
- 각 Phase Checkpoint에서 동작 확인 후 다음 Phase 진행 권장
