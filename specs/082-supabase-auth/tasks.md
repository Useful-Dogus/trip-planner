# Tasks: Supabase Auth 도입 (회원가입/로그인/재설정)

**Feature**: 082-supabase-auth
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Contracts**: [auth-api.md](./contracts/auth-api.md)

## Phase 1: Setup

- [X] T001 `package.json` 에 `@supabase/ssr` 추가 (`npm install @supabase/ssr`)
- [X] T002 `.env.example` 에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가하고 `AUTH_ID`, `AUTH_PASSWORD`, `JWT_SECRET` 항목 제거

## Phase 2: Foundational (어댑터 + 미들웨어)

- [X] T003 신규 파일 `lib/supabase-server.ts` 작성: `createServerSupabaseClient(cookieAdapter)` export. `@supabase/ssr` 의 `createServerClient` 만 wrapping. 환경변수는 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 사용
- [X] T004 `lib/auth.ts` 내부 구현 교체:
  - `verifyToken(token)` 호환 유지하되 내부에서는 미사용/no-op 으로 두거나 deprecated 주석
  - `getSession(request, response?)` 추가: Supabase `getUser()` 호출로 `{ userId, email } | null` 반환
  - `getCurrentUserId(request)` 추가: `getSession` 의 얇은 wrapper
  - `lib/supabase-server.ts` 만 import. `@supabase/ssr` 의 auth 표면을 다른 파일에 노출하지 않음
- [X] T005 `middleware.ts` 내부만 교체: `verifyToken(cookie.auth)` 대신 `getSession(request, response)` 사용. 매처, 보호 라우트 목록, redirect 정책은 그대로 유지. 응답 쿠키(refresh) 가 set 되도록 response 객체 전달

## Phase 3: User Story 1 — 로그인/로그아웃 (P1)

**Goal**: 가입된 사용자가 이메일/비밀번호로 로그인 후 보호 페이지 진입, 로그아웃 시 차단.

**Independent test**: 미리 만든 계정으로 `/login` 진입 → `/list` 노출 → 새로고침 후 세션 유지 → 로그아웃 후 `/list` → `/login` redirect.

- [X] T006 [US1] `app/api/auth/login/route.ts` 교체: 요청 `{ email, password }` 수신 → `signInWithPassword` 호출(어댑터 경유) → 성공 시 `{ ok: true }`, 실패 시 401 한국어 메시지. 쿠키는 `@supabase/ssr` 가 자동 set
- [X] T007 [US1] `app/api/auth/logout/route.ts` 교체: `signOut` 호출(어댑터 경유) → `{ ok: true }`. 쿠키는 자동 clear
- [X] T008 [P] [US1] `app/login/LoginForm.tsx` 최소 수정: `id` state → `email`, label "아이디" → "이메일", input `type="text"` → `type="email"`, `autoComplete="username"` → `"email"`, 요청 body `{ id, password }` → `{ email, password }`

## Phase 4: User Story 2 — 회원가입 + 이메일 확인 콜백 (P1)

**Goal**: 신규 이메일로 가입 → 메일 확인 링크 클릭 → 활성화된 계정으로 로그인.

**Independent test**: `POST /api/auth/signup` 으로 신규 이메일 가입 → 메일 수신 → 링크 클릭 → `/login` redirect → 동일 자격증명으로 로그인 성공.

- [X] T009 [US2] 신규 라우트 `app/api/auth/signup/route.ts`: 요청 `{ email, password }` 수신 → `signUp({ email, password, options: { emailRedirectTo: '<origin>/api/auth/callback?next=/login' } })` 어댑터 호출 → 성공 시 `{ ok: true, needsEmailConfirmation: true }`, 중복/입력 오류는 4xx 한국어
- [X] T010 [US2] 신규 라우트 `app/api/auth/callback/route.ts` (GET): 쿼리 `code`, `next` 수신 → `exchangeCodeForSession(code)` 어댑터 호출 → 성공 시 `next` (안전한 내부 경로만 허용, 아니면 `/list`) 로 302 → 실패 시 `/login?error=invalid_link` 로 302

## Phase 5: User Story 3 — 비밀번호 재설정 (P2)

**Goal**: 재설정 메일 요청 → 메일 링크 → 새 비밀번호 설정 → 새 자격증명으로 로그인.

**Independent test**: `POST /api/auth/reset-password` 로 메일 발송 → 메일 링크 클릭 → `/auth/update-password` 도착 → 새 비밀번호 제출 → 새 비밀번호로 로그인 성공.

- [X] T011 [US3] 신규 라우트 `app/api/auth/reset-password/route.ts`: 요청 `{ email }` → `resetPasswordForEmail(email, { redirectTo: '<origin>/api/auth/callback?next=/auth/update-password' })` → 항상 `{ ok: true }` (열거 방지)
- [X] T012 [US3] 신규 라우트 `app/api/auth/update-password/route.ts`: 요청 `{ password }` → 세션 확인(미세션 시 401) → `updateUser({ password })` 어댑터 호출 → `{ ok: true }`
- [X] T013 [P] [US3] 신규 페이지 `app/auth/update-password/page.tsx` (`'use client'`): 새 비밀번호 입력 폼 1 개, 제출 시 `POST /api/auth/update-password` 호출. 성공 시 `/login` 으로 redirect. `LoginForm.tsx` 스타일과 동일한 가이드 토큰 사용
- [X] T014 [US3] `middleware.ts` matcher 에 `/auth/update-password` 가 보호 목록과 충돌하지 않도록 확인 (재설정 콜백 직후 세션이 발급된 상태로 진입하므로 인증 필요. 기본 정책으로 충분하지만 명시적 확인)

## Phase 6: Polish & Cross-cutting

- [X] T015 `app/api/gmaps/import/route.ts` 등 `JWT_SECRET`/`AUTH_*` 환경변수를 참조하는 코드 모두 정리(어댑터 경유 또는 제거). `grep -rn "AUTH_ID\|AUTH_PASSWORD\|JWT_SECRET" .` 결과 0건이 되도록
- [X] T016 [P] `package.json` 에서 `jose` 의존성이 다른 곳에 쓰이지 않으면 제거. `grep -rn "from 'jose'" .` 로 확인 후 결정
- [X] T017 README 또는 `.env.example` 에 Supabase Dashboard 사전 설정(Email provider, Site URL/Redirect URLs) 안내 한 줄 추가
- [X] T018 `npm run build` 와 `npm run lint` 통과 확인
- [ ] T019 수동 회귀: [quickstart.md](./quickstart.md) §6 체크리스트 6 항목 모두 통과

## Dependencies

```
Setup (T001-T002)
  └─ Foundational (T003 → T004 → T005)
       ├─ US1 (T006, T007, T008)
       ├─ US2 (T009 → T010)
       └─ US3 (T011, T012, T013, T014)
            (T012 depends on session set by T010)
  └─ Polish (T015-T019) [모든 US 완료 후]
```

- US1/US2/US3 는 Foundational 완료 이후 병렬 가능하나, US3 의 end-to-end 검증은 US2 의 콜백(T010)에 의존.
- T008, T013, T016 은 서로 다른 파일 → `[P]` 병렬 가능.

## MVP Scope

T001-T008 (Setup + Foundational + US1) 만으로도 "단일 사용자 → 다중 사용자 인증" 의 핵심 전환이 검증된다. 단, 신규 계정을 만들려면 US2 가 필요하므로 실제 배포 MVP 는 T001-T010 으로 본다.

## Parallel Execution Examples

- Foundational 완료 후 동시 진행 가능: T006 + T007 + T008 + T009 + T011 + T013 (서로 다른 파일).
- Polish: T015, T016, T017 병렬 가능.

## Format Validation

- 모든 태스크가 `- [ ] T<id> [P?] [US?] <설명 + 경로>` 형식 ✅
- Setup/Foundational/Polish 에 `[US]` 라벨 없음 ✅
- US phase 모든 태스크에 `[US1/US2/US3]` 라벨 있음 ✅
