# Tasks: 공유 페이지 /share/{token}

## T001 — `get_shared_trip` RPC 마이그레이션
파일: `supabase/migration_113_get_shared_trip.sql`

## T002 — 익명 페치 wrapper
파일: `lib/sharedTrip.ts`
- `SharedTripPayload` 타입
- `fetchSharedTrip(token)` — 익명 supabase 클라이언트로 RPC 호출

## T003 — 공유 페이지 라우트
파일: `app/share/[token]/layout.tsx`, `app/share/[token]/page.tsx`
- 서버 컴포넌트, generateMetadata, ShareInvalid 분기

## T004 — 공유 페이지 UI 컴포넌트
파일: `components/Share/SharedItemCard.tsx`
- 읽기 전용, 모바일 우선, 편집 핸들러 없음

## T005 — 미들웨어 예외
파일: `middleware.ts`
- `/share/*` 명시 제외

## T006 — owner 발급 UI
파일: `components/Share/ShareDialog.tsx`, `app/trip/[tripId]/list/page.tsx`
- "공유" 버튼 + Sheet 다이얼로그

## T007 — 품질 게이트 + PR
- `npm run lint && npm run build`
- 커밋 + PR (Closes #113)
