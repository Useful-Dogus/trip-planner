# Contract: Auth API Routes

모든 라우트는 JSON 요청/응답, 한국어 에러 메시지. 쿠키는 `@supabase/ssr` 가 자동 처리.

## POST /api/auth/signup

- 요청: `{ email: string, password: string }`
- 응답 성공: `{ ok: true, needsEmailConfirmation: true }` (200)
- 응답 실패:
  - 400 `{ error: "이메일 형식이 올바르지 않습니다." }` 등 입력 오류
  - 409 `{ error: "이미 사용 중인 이메일입니다." }` (Supabase 가 이 케이스를 노출하지 않을 수 있어 메시지는 통합)
- 부수효과: Supabase 가 가입 확인 메일 발송. 응답 시점에 세션 쿠키는 set 하지 않음 (이메일 확인 전까지 로그인 불가).

## POST /api/auth/login

- 요청: `{ email: string, password: string }`
- 응답 성공: `{ ok: true }` (200) + 세션 쿠키 set
- 응답 실패: 401 `{ error: "자격증명이 올바르지 않습니다." }`
- 부수효과: Supabase 세션 쿠키 발급.

## POST /api/auth/logout

- 요청: 없음
- 응답: `{ ok: true }` (200)
- 부수효과: Supabase 세션 쿠키 제거 (`signOut`).

## POST /api/auth/reset-password

- 요청: `{ email: string }`
- 응답: `{ ok: true }` (200) — 이메일 존재 여부에 관계없이 동일 응답(열거 공격 방지).
- 부수효과: 등록된 이메일이면 Supabase 가 재설정 메일 발송. 메일 링크는 `/api/auth/callback?code=...&next=/auth/update-password` 로 향한다.

## POST /api/auth/update-password

- 요청: `{ password: string }`
- 사전조건: 세션 쿠키가 존재해야 한다 (재설정 메일 콜백이 세션을 발급한 직후).
- 응답 성공: `{ ok: true }` (200)
- 응답 실패: 401 `{ error: "세션이 만료되었습니다. 재설정 링크를 다시 받아주세요." }` 또는 400 입력 오류.

## GET /api/auth/callback

- 쿼리: `?code=<string>&next=<path>`
- 동작: `exchangeCodeForSession(code)` → 세션 쿠키 set → `next` 로 302 redirect. `next` 가 없거나 안전하지 않으면 `/list` 로.
- 에러: 코드 검증 실패 시 `/login?error=invalid_link` 로 redirect.

## 미들웨어 게이팅 (변경 없음)

- 보호 페이지: `/list`, `/map`, `/schedule`, `/items`, `/gmaps-import` → 미인증 시 `/login` 으로 redirect.
- 보호 API: `/api/items`, `/api/geocode`, `/api/gmaps` → 미인증 시 401.
- `/login` 접근 시 이미 인증되어 있으면 `/list` 로 redirect.

## 어댑터 표면 (lib/auth.ts)

- `verifyToken(token: string): Promise<boolean>` — 호환 유지.
- `getSession(request, response?): Promise<AuthSession>` — middleware/route handler 에서 사용.
- `getCurrentUserId(request): Promise<string | null>` — 후속 #108 에서 사용.
- 외부에서는 `@supabase/...` 의 auth API 를 import 하지 않는다.
