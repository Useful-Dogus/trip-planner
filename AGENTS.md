# AGENTS.md

> 코딩 에이전트(Claude Code · Codex · Gemini CLI · Cursor 등) 공통 진입점이다.
> 도구별 설정 파일은 이 문서를 가리키므로, **규칙은 여기와 링크된 문서 한 곳에서만** 관리한다.

## 프로젝트 개요

- trip-planner — Next.js 14 (App Router) · React 18 · TypeScript 5.x · Tailwind 3.x · Supabase.
- 구조: `app/` (페이지+API), `components/` (UI), `lib/` (도메인·어댑터), `types/`, `supabase/` (스키마), `middleware.ts` (인증).
- 로컬 개발: `npm run dev` (http://localhost:3000)

## 작업 규율 — 반드시 따른다

1. **리팩토링 / tidy-first / 구조 변경** → [docs/refactoring-guidelines.md](docs/refactoring-guidelines.md)
   개발 중간중간 정리할 때의 단일 기준. 핵심: **구조 변경과 동작 변경을 섞지 말고 따로 커밋**, 작게·검증 유지·범위 정직.
2. **신규 기능 / 기존 UI 수정** → [CLAUDE.md](CLAUDE.md) 의 **Basics-First Rule** 게이트(컨텍스트 표시·CRUD 대칭·카피 정직성·진입점 일관성·사이징·접근성)를 자기검열.
3. **디자인 / 컴포넌트** → [docs/design-guidelines.md](docs/design-guidelines.md) (메커닉) + [docs/taste-for-waypost.md](docs/taste-for-waypost.md) (판단). hex 직접 사용·임의 spacing/radius 금지, 토큰 체계 사용.

## 커밋 / PR 규약

- Conventional Commits. 구조 변경은 `refactor:` 또는 `style:`, 동작 변경은 `feat:`/`fix:` 로 **분리**한다.
- 범위(range) 표기는 `~` 대신 `-` 사용 (예: `1-10`).
- 커밋 메시지·PR 본문에 AI 생성 문구(`Co-Authored-By: Claude`, `🤖 Generated with Claude Code` 등)를 넣지 않는다.
- 구현 완료된 `specs/` 문서는 히스토리 보관용 — 수정하지 않는다.
