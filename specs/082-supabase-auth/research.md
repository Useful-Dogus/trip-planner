# Phase 0 Research: Supabase Auth 도입

## R-1. SSR 패키지 선택

**Decision**: `@supabase/ssr` 채택.

**Rationale**:
- Next.js App Router(서버 컴포넌트/Route Handler/Middleware) 에서 쿠키 기반 세션을 일관되게 다루는 공식 권장 패키지.
- `createServerClient` 와 `createBrowserClient` 가 같은 쿠키 저장소(httpOnly 쿠키)에 대해 일관된 read/write 인터페이스를 제공.
- `middleware.ts` 에서도 `createServerClient` 로 동일하게 세션 검증 가능.

**Alternatives**:
- `@supabase/auth-helpers-nextjs` — 이미 deprecated. 사용 금지.
- 자체 fetch 로 Supabase REST 호출 — 쿠키 동기화/refresh-token 로테이션 직접 구현 부담 큼.

## R-2. 쿠키 모델

**Decision**: Supabase 가 발행하는 `sb-access-token` / `sb-refresh-token` 쿠키를 그대로 사용. 기존 `auth` 쿠키는 제거.

**Rationale**:
- `@supabase/ssr` 가 자동으로 쿠키 set/get/remove 를 처리하고 refresh 도 책임진다.
- httpOnly + Secure(prod) + SameSite=Lax 기본값으로 FR-005 충족.

**Alternatives**:
- 자체 `auth` 쿠키 유지하고 access_token 만 직접 저장 — refresh 토큰 로테이션이 깨져 단명 세션이 됨. 기각.

## R-3. 미들웨어 동작

**Decision**: `middleware.ts` 는 `lib/auth.ts` 의 `getSession(request)` 헬퍼를 호출해 boolean 을 받는다. 외부 매처/리다이렉트 정책은 그대로.

**Rationale**:
- FR-013(외부 호출부 회귀 금지) 충족.
- 어댑터 원칙(FR-012): `middleware.ts` 가 직접 `@supabase/...` 를 import 하지 않게 한다.
- Next.js 미들웨어는 쿠키를 통해 토큰을 읽기만 하고, refresh 응답을 다음 응답 헤더에 합쳐 보낸다 → `lib/auth.ts` 가 `request` 와 `response` 양쪽에 쿠키 어댑터를 연결해 처리.

**Alternatives**:
- 미들웨어에서 `@supabase/ssr` 직접 호출 — 짧지만 어댑터 원칙 위반. 기각.

## R-4. 이메일 확인 / 비밀번호 재설정 콜백 처리

**Decision**: `app/api/auth/callback/route.ts` 에서 Supabase 가 보낸 `code` 쿼리를 `exchangeCodeForSession(code)` 로 세션 쿠키로 변환. 가입 확인은 `/login` 으로 리다이렉트, 비밀번호 재설정은 `/auth/update-password` 로 리다이렉트.

**Rationale**:
- Supabase Email 템플릿 기본 PKCE flow 는 `?code=...` 를 콜백 URL 로 보낸다.
- 한 콜백에서 redirect 분기(`next` 쿼리)로 두 흐름 모두 처리 가능.

**Alternatives**:
- 두 개의 콜백 라우트 분리 — 단순하지만 중복. 기각.

## R-5. 기존 `jose` 의존성

**Decision**: `jose` 는 본 이슈에서 제거하지 않는다. Supabase access_token 자체가 JWT 이지만 본 이슈에서는 `getUser()` 응답 검증으로 충분(서버 → Supabase 1 hop). `jose` 가 다른 곳에서 쓰이지 않으면 별도 cleanup PR 에서 제거.

**Rationale**: 의존성 정리 충돌 회피, 이슈 범위 축소.

## R-6. 기존 `AUTH_ID`/`AUTH_PASSWORD`/`JWT_SECRET`

**Decision**: 코드에서 모두 제거(FR-011). `.env.example` 에서도 제거. 운영 환경 변수 정리는 PR 본문 체크리스트로 사용자에게 안내.

## R-7. 로그인 UI 변경 범위

**Decision**: `LoginForm.tsx` 에서 "아이디" 라벨/`type="text"` → "이메일" 라벨/`type="email"` 로 최소 수정. autoComplete 도 `username` → `email`. 회원가입/재설정 진입 링크는 본 이슈에서 추가하지 않음(#111). 가입과 재설정은 API 직접 호출(혹은 curl)로 검증 가능.

**Rationale**: 이슈 본문에 "UI 변경 최소화, 본격 UI 는 #111" 명시.

대안 검토: 가입/재설정 페이지를 최소한이라도 만들지 않으면 PR 단독 검증이 번거롭다 → 그래도 `/auth/update-password` 한 페이지는 만든다 (재설정 메일이 도착하는 곳이므로 페이지 없으면 검증 불가). 가입/재설정 **요청** 폼은 만들지 않고 API 호출로 검증한다.

## R-8. Supabase 클라이언트 생성 위치

**Decision**: `lib/supabase-server.ts` 신규 파일에 `createServerSupabaseClient(cookieAdapter)` 만 export. 이 파일은 `lib/auth.ts` 만 import 한다. 다른 파일은 절대 import 금지(린트로 강제하진 않고 컨벤션으로).

**Rationale**:
- `lib/auth.ts` 가 비대해지지 않게 분리.
- 어댑터 원칙은 "Supabase auth API 직접 호출 금지" 이므로 `createServerClient` 자체는 `lib/supabase-server.ts` 에 있어도 OK. auth 기능은 `lib/auth.ts` 가 wrap.

## R-9. 검증 시나리오(메일)

**Decision**: 검증은 실제 Supabase 메일 발송으로 한다. 본인 이메일(chanhee13p@gmail.com) 사용. 메일 도착 SLA 는 Supabase 인프라에 의존하므로 본 이슈에서 자동화하지 않음.

## R-10. RLS / 데이터 접근 변경 여부

**Decision**: 본 이슈는 인증만 다룬다. `lib/data.ts` 는 여전히 `SUPABASE_SERVICE_KEY` 로 모든 데이터 접근(전역). RLS 활성화 / 사용자 단위 접근 제한은 #108 의 책임. 단, 후속 #108 에서 lib/data.ts 도 사용자 컨텍스트로 전환할 수 있도록 본 이슈에서 `lib/auth.ts` 에 `getCurrentUserId()` 같은 헬퍼는 노출해둔다.

**Rationale**: 이슈 범위 명확화. 데이터 모델 변경은 OOS.
