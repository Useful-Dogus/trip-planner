# Tasks: shares 테이블 + 익명 RLS 정책

**Plan**: [plan.md](./plan.md)

## T001 — 마이그레이션 작성

파일: `supabase/migration_110_shares_table.sql`

- [ ] `shares` 테이블 + `idx_shares_trip` 인덱스
- [ ] `share_token_grants_access(uuid)` SECURITY DEFINER 함수
- [ ] `set_share_token(uuid)` SECURITY DEFINER 함수 (anon 실행 가능)
- [ ] `shares` 테이블 RLS 활성 + 4개 정책 (select/insert/update/delete)
- [ ] `trips_select` 정책 갱신 (멤버 OR 토큰)
- [ ] `items_select` 정책 갱신 (멤버 OR 토큰)
- [ ] 파일 하단 검증 SQL 주석

## T002 — `lib/share.ts` 구현

파일: `lib/share.ts` (신규)

- [ ] `Share` 타입 정의
- [ ] `createShare(client, tripId, options?)` — owner only
- [ ] `listSharesForTrip(client, tripId)` — owner 목록 조회
- [ ] `revokeShare(client, token)` — `revoked_at` 기록
- [ ] `applyShareTokenToSession(client, token)` — `set_share_token` RPC wrapper
- [ ] JSDoc 한 줄씩만, 과한 주석 금지

## T003 — 타입/빌드 검증

- [ ] `npm run lint`
- [ ] `npm run build`

## T004 — 커밋 & PR

- [ ] Conventional Commits 메시지(한국어)
- [ ] PR 본문에 `Closes #110` + 검증 결과 + 남은 작업(#113 의존)
