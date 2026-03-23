# trip-planner Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-23

## Active Technologies

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

- 001-trip-planner-mvp: Added TypeScript + Node.js 18+ + Next.js 14+ (App Router), Tailwind CSS, react-leaflet + Leaflet.js, jose (JWT)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
