# Tasks — RLS + trip_members

순서대로 진행. 각 태스크는 가능하면 단일 커밋.

## T1. DB: schema.sql + 마이그레이션 SQL 작성

- [ ] `supabase/schema.sql` 갱신
  - `trips`, `trip_members` 테이블 정의
  - `items.trip_id` 컬럼 포함 (신규 호스트는 처음부터 적용)
  - `is_trip_member`, `user_role_in_trip` SECURITY DEFINER 함수
  - 전체 RLS 정책 (trips/trip_members/items)
  - `grant execute ... to authenticated`
- [ ] `supabase/migration_108_rls_trip_members.sql` 생성
  - 단일 트랜잭션 (`begin; ... commit;`)
  - chanhee13p@gmail.com 의 user_id 조회 + NOT FOUND 시 RAISE EXCEPTION
  - 테이블/함수/정책 생성
  - default trip "내 여행" 1건 INSERT
  - owner 멤버십 1건 INSERT
  - items.trip_id 추가 (nullable)
  - 기존 items 전부 UPDATE
  - items.trip_id NOT NULL + FK
  - 기존 items 의 RLS (#107 이전엔 service_role 우회) 가 비활성 상태인지 확인 후 enable + 정책 적용

## T2. lib/trip.ts 신규

- [ ] `lib/trip.ts` 생성
  - `TripRole` 타입
  - `getActiveTripId(client)`: trip_members 에서 첫 번째 멤버십 trip_id 반환 (owner 우선, 그 다음 invited_at asc)
  - `ensureActiveTrip(client)`: 멤버십이 0개면 새 trip 생성 + 자기 멤버십 INSERT, 그 trip_id 반환
  - `getUserRole(client, tripId)`: trip_members 에서 role 조회

## T3. lib/data.ts 리팩터

- [ ] `getSupabaseClient()` 제거
- [ ] 모든 export 함수 시그니처 변경: 첫 인자에 `SupabaseClient` 받음
- [ ] `readItems(client)`, `writeItems(client, items)`, `getItem(client, id)` 등 내부에서 `ensureActiveTrip(client)` 호출 → 자동 trip_id 스코프
- [ ] `writeItems` 의 upsert payload 에 `trip_id` 포함
- [ ] `SUPABASE_SERVICE_KEY` 잔존 참조 제거

## T4. 호출부 갱신 (7곳)

각 호출부에서 컨텍스트에 맞는 클라이언트를 만들어 data 함수에 주입.

- [ ] `app/api/items/route.ts` — `createRouteHandlerSupabase()`
- [ ] `app/api/items/[id]/route.ts` — 동일
- [ ] `app/api/gmaps/preview/route.ts` — 동일
- [ ] `app/api/gmaps/import/route.ts` — 동일
- [ ] `app/items/[id]/page.tsx` — 서버 컴포넌트용 클라이언트 (SSR cookies)
- [ ] `app/items/[id]/edit/page.tsx` — 동일

## T5. 인증 가드

- [ ] 모든 데이터 라우트/페이지에서 `getSession()` 없으면 401/리다이렉트 (대부분 #107 미들웨어로 처리, 보강 필요한 곳만)

## T6. 검증

- [ ] `npm run build` 통과
- [ ] (운영 DB 적용 후) quickstart.md 시나리오 1-5 수동 검증
- [ ] `grep -r SUPABASE_SERVICE_KEY` 잔존 0건 확인 (env/문서 제외)

## T7. PR

- [ ] 커밋 분리 (T1 / T2-T3 / T4 / 검증 수정)
- [ ] PR 본문에 마이그레이션 적용 안내, Closes #108
