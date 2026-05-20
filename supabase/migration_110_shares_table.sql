-- Issue #110 — shares 테이블 + 익명 RLS 정책
-- 사전 조건: migration_108_rls_trip_members.sql 이 적용되어 있어야 한다
--           (trips, trip_members, items, is_trip_member, user_role_in_trip 존재).
-- Supabase SQL Editor 에서 한 번 실행. 트랜잭션 내에서 처리되어 부분 실패 시 롤백.

begin;

-- ---------------------------------------------------------------------------
-- 1. shares 테이블
-- ---------------------------------------------------------------------------

create table if not exists public.shares (
  token              uuid        primary key default gen_random_uuid(),
  trip_id            uuid        not null references public.trips(id) on delete cascade,
  created_by_user_id uuid        not null references auth.users(id) on delete cascade,
  created_at         timestamptz not null default now(),
  expires_at         timestamptz,
  revoked_at         timestamptz
);

create index if not exists idx_shares_trip on public.shares(trip_id);

-- ---------------------------------------------------------------------------
-- 2. 헬퍼 함수
-- ---------------------------------------------------------------------------

-- 익명 세션에 share token 을 주입한다 (#113 공유 페이지에서 매 요청 전 호출).
-- set_config 의 세 번째 인자가 false 이면 세션 단위 — PostgREST 의 단일-요청-단일-트랜잭션
-- 모델에서는 후속 쿼리에 영향을 주지 않으므로, 본 RPC 와 read 쿼리를 같은 요청에 묶거나
-- (RPC 결과의 후처리), 단일 RPC 함수로 묶어 호출해야 한다. 자세한 패턴은 #113 에서 결정.
create or replace function public.set_share_token(p_token uuid)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  select set_config('app.share_token', p_token::text, false);
$$;

revoke all on function public.set_share_token(uuid) from public;
grant execute on function public.set_share_token(uuid) to anon, authenticated;

-- 현재 세션 변수의 토큰이 해당 trip 에 대한 유효 share 인지 평가.
-- 토큰 미설정 / 만료 / 철회 시 false.
create or replace function public.share_token_grants_access(p_trip_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from public.shares s
    where s.trip_id = p_trip_id
      and s.token = nullif(current_setting('app.share_token', true), '')::uuid
      and s.revoked_at is null
      and (s.expires_at is null or s.expires_at > now())
  )
$$;

revoke all on function public.share_token_grants_access(uuid) from public;
grant execute on function public.share_token_grants_access(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. shares RLS
-- ---------------------------------------------------------------------------

alter table public.shares enable row level security;

-- SELECT: 멤버는 자신이 속한 trip 의 모든 토큰 메타 조회 가능.
-- 익명은 자신이 알고 있는(세션 변수에 설정한) 토큰 1건만 조회 가능 (enumeration 방지).
drop policy if exists shares_select on public.shares;
create policy shares_select on public.shares
  for select
  using (
    public.is_trip_member(trip_id)
    or token = nullif(current_setting('app.share_token', true), '')::uuid
  );

-- INSERT: 해당 trip 의 owner 만, created_by_user_id 는 본인으로 강제.
drop policy if exists shares_insert on public.shares;
create policy shares_insert on public.shares
  for insert to authenticated
  with check (
    public.user_role_in_trip(trip_id) = 'owner'
    and created_by_user_id = auth.uid()
  );

-- UPDATE: owner 만 (revoked_at 기록 용도).
drop policy if exists shares_update on public.shares;
create policy shares_update on public.shares
  for update to authenticated
  using (public.user_role_in_trip(trip_id) = 'owner')
  with check (public.user_role_in_trip(trip_id) = 'owner');

-- DELETE: owner 만.
drop policy if exists shares_delete on public.shares;
create policy shares_delete on public.shares
  for delete to authenticated
  using (public.user_role_in_trip(trip_id) = 'owner');

-- ---------------------------------------------------------------------------
-- 4. trips / items SELECT 정책 갱신 — 멤버이거나 유효한 share 토큰이 있으면 허용
-- ---------------------------------------------------------------------------

drop policy if exists trips_select on public.trips;
create policy trips_select on public.trips
  for select
  using (
    public.is_trip_member(id)
    or public.share_token_grants_access(id)
  );

drop policy if exists items_select on public.items;
create policy items_select on public.items
  for select
  using (
    public.user_role_in_trip(trip_id) is not null
    or public.share_token_grants_access(trip_id)
  );

-- INSERT/UPDATE/DELETE 정책 (trips, items, trip_members) 는 변경하지 않는다.
-- 모두 auth.uid() / 멤버십 기반이므로 anon 역할은 자동으로 차단됨.

commit;

-- ---------------------------------------------------------------------------
-- 검증 쿼리 (별도 실행):
--   -- shares 테이블 존재 확인
--   select count(*) from information_schema.tables
--    where table_schema='public' and table_name='shares';            -- 1
--
--   -- 헬퍼 함수 존재 확인
--   select proname from pg_proc
--    where proname in ('share_token_grants_access','set_share_token')
--    order by proname;                                               -- 2 rows
--
--   -- 정책 갱신 확인
--   select polname, pg_get_expr(polqual, polrelid)
--     from pg_policy
--    where polrelid in ('public.trips'::regclass, 'public.items'::regclass)
--      and polname in ('trips_select','items_select');
-- ---------------------------------------------------------------------------
