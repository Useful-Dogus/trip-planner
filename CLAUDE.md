# trip-planner Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-24

## Active Technologies
- TypeScript + Node.js 18+ + Next.js 14 (App Router), jose (JWT) (002-login-redirect)
- N/A (쿠키 기반 인증 토큰) (002-login-redirect)

- TypeScript + Node.js 18+ + Next.js 14+ (App Router), Tailwind CSS, react-leaflet + Leaflet.js, jose (JWT) (001-trip-planner-mvp)

## Project Structure

```text
app/           # Next.js App Router (pages + API routes)
components/    # React 컴포넌트 (Map/, Items/, UI/)
lib/           # 공통 유틸 (auth.ts, data.ts, geocode.ts)
types/         # TypeScript 타입 정의
data/          # items.json (여행 데이터, Git 추적)
middleware.ts  # JWT 인증 라우트 보호
```

## Commands

npm run dev    # 로컬 개발 서버 (http://localhost:3000)

## Code Style

TypeScript + Node.js 18+: Follow standard conventions

## Recent Changes
- 002-login-redirect: Added TypeScript + Node.js 18+ + Next.js 14 (App Router), jose (JWT)

- 001-trip-planner-mvp: Added TypeScript + Node.js 18+ + Next.js 14+ (App Router), Tailwind CSS, react-leaflet + Leaflet.js, jose (JWT)

<!-- MANUAL ADDITIONS START -->
## Attribution Policy

- 커밋 메시지에 `Co-Authored-By: Claude` 등 AI 관련 문구를 추가하지 말 것
- PR 본문에 `🤖 Generated with Claude Code` 등 AI 관련 문구를 추가하지 말 것
<!-- MANUAL ADDITIONS END -->
