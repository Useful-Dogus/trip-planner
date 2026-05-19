# Data Model: Supabase Auth 도입

본 이슈는 자체 테이블을 만들지 않는다. Supabase Auth 가 관리하는 `auth.users` 만 사용한다.

## auth.users (Supabase 관리)

읽기 전용. 본 이슈에서 직접 SQL 로 만지지 않는다.

| 필드 | 용도 |
|---|---|
| `id` (uuid) | 시스템 내 안정적 사용자 ID. 후속 #108 의 `trip_members.user_id` FK 대상. |
| `email` | 식별/통신용. |
| `email_confirmed_at` | null 이면 미확인 계정. 미확인 상태에서는 로그인 차단(Supabase 기본 정책). |
| `created_at` / `updated_at` | 감사용. |

## 세션 (Supabase 관리)

- access_token: 짧은 만료(1h 기본). 쿠키 `sb-<project-ref>-auth-token` 에 저장.
- refresh_token: 회전식. 같은 쿠키 페이로드에 함께 저장.
- `@supabase/ssr` 가 쿠키 read/write 를 자동 처리.

## Password Reset Token (Supabase 관리)

- 메일 링크 내 `code` 파라미터. 일회성, 만료 있음. `exchangeCodeForSession(code)` 로 세션 발급.

## 어댑터가 노출하는 타입

`lib/auth.ts` 가 외부에 노출하는 최소 타입(다른 파일이 의존해도 안전한 표면):

```ts
// 의도만 표현, 정확한 시그니처는 구현 단계에서 확정
export type AuthSession = {
  userId: string
  email: string
} | null

export async function verifyToken(token: string): Promise<boolean>          // 기존 호환
export async function getSession(request: NextRequest, response?: NextResponse): Promise<AuthSession>
export async function getCurrentUserId(request: NextRequest): Promise<string | null>
```

다른 파일은 `@supabase/...` 의 auth API 를 직접 import 하지 않는다.
