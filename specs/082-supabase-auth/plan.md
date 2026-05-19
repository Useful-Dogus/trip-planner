# Implementation Plan: Supabase Auth 도입 (회원가입/로그인/재설정)

**Branch**: `082-supabase-auth` | **Date**: 2026-05-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/082-supabase-auth/spec.md`

## Summary

자체 JWT + 단일 공유 자격증명을 Supabase Auth(@supabase/ssr) 로 교체한다. 어댑터 원칙(FR-012)에 따라 `lib/auth.ts` 단일 파일이 Supabase 호출의 유일한 진입점이 된다. `/api/auth/{login,logout,signup,reset-password,update-password}` 라우트를 정비하고, `middleware.ts` 의 외부 시그니처는 유지한 채 내부 구현만 Supabase 세션 쿠키 검증으로 교체한다. 본 이슈는 동작 가능한 최소 UI(`/login` 의 이메일 라벨 정도) 외 UI 작업은 모두 #111 로 분리한다.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+
**Primary Dependencies**: Next.js 14 (App Router), React 18, `@supabase/supabase-js` ^2.100, `@supabase/ssr` (신규 추가), Tailwind 3.x
**Storage**: Supabase Auth (auth.users 자동 관리). 본 이슈 자체 신규 테이블 없음. 후속 #108 에서 `trip_members` 등 추가 예정.
**Testing**: 수동 회귀(로컬 `npm run dev` + 메일 수신 확인). 자동 테스트는 본 이슈 범위 밖.
**Target Platform**: 웹 (Next.js dev + Vercel 배포). 클라이언트 React + Edge/Node 서버.
**Project Type**: Web application (단일 Next.js 앱; backend 라우트는 `app/api/*`).
**Performance Goals**: 로그인 응답 5 초 이내 (SC-002), 가입 메일 발송 60 초 이내 (SC-001) — 모두 사용자 체감 기준.
**Constraints**:
  - 어댑터 원칙(FR-012): `@supabase/...` auth API 직접 호출은 `lib/auth.ts` 안에서만.
  - 미들웨어 외부 호출부 회귀 금지(FR-013): 보호 라우트 목록 동일.
  - 메일 발송은 Supabase 기본 메일 사용.
**Scale/Scope**: 코드 변경 규모는 lib/auth.ts, middleware.ts, app/api/auth/* (5 라우트), app/login/LoginForm.tsx, .env.example, package.json. 신규 페이지 1 개(`/auth/update-password`).

## Constitution Check

*Constitution 파일이 템플릿 미작성 상태(`.specify/memory/constitution.md` 가 PROJECT_NAME 등 placeholder).* 따라서 정량 게이트 없음. 본 프로젝트의 실효 가이드는 `CLAUDE.md`(Attribution, Directory Rules, Design Guidelines)와 운영 컨벤션을 따른다.

- Attribution Policy 준수 (커밋/PR 에 AI 서명 금지) ✅
- Directory Rules 준수 (완료된 spec 디렉터리 미수정) ✅
- Design Guidelines: 본 이슈는 UI 변경 최소화이므로 라벨/문구 수정만 가이드 토큰 범위 내에서 처리 ✅

게이트 위반 없음. Phase 0 진행.

## Project Structure

### Documentation (this feature)

```text
specs/082-supabase-auth/
├── plan.md                          # 본 파일
├── spec.md                          # 작성 완료
├── research.md                      # Phase 0
├── data-model.md                    # Phase 1
├── quickstart.md                    # Phase 1
├── contracts/
│   └── auth-api.md                  # 인증 라우트 계약
├── checklists/
│   └── requirements.md              # 작성 완료
└── tasks.md                         # /speckit.tasks 단계 산출물
```

### Source Code (repository root)

```text
app/
├── api/
│   └── auth/
│       ├── login/route.ts           # 교체: signInWithPassword
│       ├── logout/route.ts          # 교체: signOut
│       ├── signup/route.ts          # 신규: signUp (이메일 확인 발송)
│       ├── reset-password/route.ts  # 신규: resetPasswordForEmail
│       ├── update-password/route.ts # 신규: 세션 기반 updateUser({password})
│       └── callback/route.ts        # 신규: Supabase 이메일 링크 토큰 교환
├── auth/
│   └── update-password/page.tsx     # 신규: 재설정 메일에서 진입하는 최소 폼
└── login/
    ├── LoginForm.tsx                # 최소 수정: id → email
    └── page.tsx                     # 변경 없음

lib/
├── auth.ts                          # 내부 구현 전면 교체 (어댑터 진입점)
└── supabase-server.ts               # 신규: 서버 Supabase 클라이언트 팩토리 (lib/auth.ts 에서만 사용)

middleware.ts                        # 내부만 교체, 외부 시그니처/매처 유지
.env.example                         # ANON_KEY 추가, AUTH_*/JWT_SECRET 제거
package.json                         # @supabase/ssr 추가, jose 제거 검토
```

**Structure Decision**: 단일 Next.js 앱 구조(현행) 유지. 새 디렉토리는 만들지 않고 기존 `app/api/auth`, `app/login`, `lib/` 에 추가한다. `app/auth/update-password/` 한 페이지만 신설.

## Complexity Tracking

게이트 위반 없음 — 미작성.
