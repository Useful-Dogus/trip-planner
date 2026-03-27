# trip-planner Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-27

## Active Technologies
- TypeScript 5.x + Node.js 18+ + Next.js 14+ (App Router), React 18, Tailwind CSS 3.x (004-mobile-panel-ux)
- N/A (UI 전용 변경) (004-mobile-panel-ux)
- TypeScript 5.x + Node.js 18+ + Next.js 14.2.0 (App Router), React 18.3.1, Tailwind CSS 3.x, SWR (신규 추가) (005-data-caching-fast-ux)
- Supabase (서버), localStorage (클라이언트 캐시) (005-data-caching-fast-ux)

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

## Recent Changes
- 005-data-caching-fast-ux: Added TypeScript 5.x + Node.js 18+ + Next.js 14.2.0 (App Router), React 18.3.1, Tailwind CSS 3.x, SWR (신규 추가)
- 004-mobile-panel-ux: Added TypeScript 5.x + Node.js 18+ + Next.js 14+ (App Router), React 18, Tailwind CSS 3.x

- 003-panel-editing-ux: Added TypeScript 5.x + Node.js 18+ + Next.js 14+ (App Router), Tailwind CSS 3.x, React 18


<!-- MANUAL ADDITIONS START -->

## Attribution Policy

- 커밋 메시지에 `Co-Authored-By: Claude` 등 AI 관련 문구를 추가하지 말 것
- PR 본문에 `🤖 Generated with Claude Code` 등 AI 관련 문구를 추가하지 말 것

## Directory Rules

- 구현 완료된 스펙의 `specs/` 문서는 과거 히스토리 보관용이므로 수정하지 않는다.
<!-- MANUAL ADDITIONS END -->
