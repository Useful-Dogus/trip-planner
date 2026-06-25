# trip-planner Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-05-19

## Active Technologies
- TypeScript 5.x + Node.js 18+ + Next.js 14+ (App Router), React 18, Tailwind CSS 3.x (004-mobile-panel-ux)
- N/A (UI 전용 변경) (004-mobile-panel-ux)
- TypeScript 5.x + Node.js 18+ + Next.js 14.2.0 (App Router), React 18.3.1, Tailwind CSS 3.x, SWR (신규 추가) (005-data-caching-fast-ux)
- Supabase (서버), localStorage (클라이언트 캐시) (005-data-caching-fast-ux)
- TypeScript 5.x + Node.js 18+ + Next.js 14.2.0 (App Router), React 18.3.1, fuse.js (신규), @supabase/supabase-js (006-gmaps-import)
- Supabase (PostgreSQL) — `items` 테이블에 `google_place_id` 컬럼 추가 (006-gmaps-import)
- Markdown (표준) + N/A (문서 파일만 작성) (010-add-readme-docs)
- TypeScript 5.x + Next.js 14 (App Router), React 18, Tailwind CSS 3.x (013-filter-ui-mobile)
- N/A (클라이언트 상태만 변경) (013-filter-ui-mobile)
- TypeScript 5.x + Next.js 14 (App Router), React 18, Tailwind CSS 3.x, SWR (014-nav-ux-overhaul)
- N/A (UI 전용 변경, 데이터 모델 변경 없음) (014-nav-ux-overhaul)
- TypeScript 5.x, Node.js 18+ + Next.js 14 (App Router), React 18, `@supabase/supabase-js` ^2.100, `@supabase/ssr` (신규 추가), Tailwind 3.x (082-supabase-auth)
- Supabase Auth (auth.users 자동 관리). 본 이슈 자체 신규 테이블 없음. 후속 #108 에서 `trip_members` 등 추가 예정. (082-supabase-auth)

- TypeScript 5.x + Node.js 18+ + Next.js 14+ (App Router), Tailwind CSS 3.x, React 18 (003-panel-editing-ux)
- Supabase (데이터 저장소, 파일 기반에서 마이그레이션 완료)

- TypeScript + Node.js 18+ + Next.js 14+ (App Router), Tailwind CSS, react-leaflet + Leaflet.js, jose (JWT) (001-trip-planner-mvp)

## Project Structure

```text
app/           # Next.js App Router (pages + API routes)
components/    # React 컴포넌트 (Map/, Items/, UI/)
lib/           # 공통 유틸 (auth.ts, data.ts, geocode.ts)
types/         # TypeScript 타입 정의
supabase/      # DB 스키마 (schema.sql)
middleware.ts  # JWT 인증 라우트 보호
```

## Commands

npm run dev # 로컬 개발 서버 (http://localhost:3000)

## Code Style

TypeScript + Node.js 18+: Follow standard conventions

## Refactoring / Tidy-First

- 개발 중간중간 수행하는 리팩토링·tidy-first·구조/아키텍처 변경은 [docs/refactoring-guidelines.md](docs/refactoring-guidelines.md) 를 단일 기준으로 따른다 (도구 중립, Codex·Gemini 공통).
- 핵심: **구조 변경과 동작 변경을 한 커밋에 섞지 않는다.** 구조 변경은 `refactor:`/`style:`, 동작 변경은 `feat:`/`fix:` 로 분리. 작게·검증 유지·요청 범위 정직.
- 도구 중립 진입점은 루트 [AGENTS.md](AGENTS.md) — 어떤 에이전트를 쓰든 같은 규칙을 읽는다.

@docs/refactoring-guidelines.md

## Basics-First Rule

- 신규 기능을 추가하거나 기존 UI 를 수정할 때는 [docs/basics-first-rule.md](docs/basics-first-rule.md) 를 먼저 통과한다.
- 핵심: 컨텍스트 표시, CRUD 대칭, 카피 정직성, 진입점 일관성, 모달·시트 사이징, 접근성, 단일-trip 시대 잔재 금지.
- 이 규칙의 원천은 도구 중립 문서인 [docs/basics-first-rule.md](docs/basics-first-rule.md) 이며, `CLAUDE.md` 는 호환용 진입점일 뿐이다.

@docs/basics-first-rule.md

## Design Guidelines

- 신규 화면·컴포넌트를 디자인하거나 기존 UI 를 수정할 때는 [docs/design-guidelines.md](docs/design-guidelines.md) 를 먼저 참고한다.
- Shopify Polaris, Apple HIG, Microsoft Fluent 2 의 핵심 원칙을 trip-planner 맥락에 맞춰 정리한 단일 가이드이며, 컬러/타이포/레이아웃/모션/접근성/콘텐츠/패턴/체크리스트를 포함한다.
- hex 직접 사용·변칙 spacing·임의 radius/shadow 는 가이드 토큰 체계로 정렬한다.

## Recent Changes
- 082-supabase-auth: Added TypeScript 5.x, Node.js 18+ + Next.js 14 (App Router), React 18, `@supabase/supabase-js` ^2.100, `@supabase/ssr` (신규 추가), Tailwind 3.x
- 014-nav-ux-overhaul: Added TypeScript 5.x + Next.js 14 (App Router), React 18, Tailwind CSS 3.x, SWR
- 013-filter-ui-mobile: Added TypeScript 5.x + Next.js 14 (App Router), React 18, Tailwind CSS 3.x



<!-- MANUAL ADDITIONS START -->

## Attribution Policy

- 커밋 메시지에 `Co-Authored-By: Claude` 등 AI 관련 문구를 추가하지 말 것
- PR 본문에 `🤖 Generated with Claude Code` 등 AI 관련 문구를 추가하지 말 것

## Directory Rules

- 구현 완료된 스펙의 `specs/` 문서는 과거 히스토리 보관용이므로 수정하지 않는다.
<!-- MANUAL ADDITIONS END -->
