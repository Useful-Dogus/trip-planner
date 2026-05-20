# Implementation Plan: shares 테이블 + 익명 RLS 정책

**Spec**: [spec.md](./spec.md)
**Issue**: [#110](https://github.com/Useful-Dogus/trip-planner/issues/110)
**Branch**: `109-shares-rls`

## 기술 결정

| 영역 | 결정 | 근거 |
|---|---|---|
| DB | Supabase Postgres | 기존 스택 |
| 정책 | RLS (네이티브) | #108 패턴 일관성, NestJS 미들웨어 회피(#121 결정) |
| 토큰 | UUID v4 (`gen_random_uuid()`) | 추측 불가, 기존 PK 컨벤션 |
| 헬퍼 함수 | SECURITY DEFINER + `set search_path = public` | #108 패턴(`is_trip_member`)과 동일 |
| 익명 컨텍스트 전달 | PostgreSQL `current_setting('request.jwt.claims', true)` 미사용. 대신 **헬퍼 함수가 `current_setting('request.headers', true)` 또는 `set_config` 기반 세션 변수**를 사용 — 그러나 Supabase에서는 익명 토큰을 쿼리 시 직접 전달하기 어려움. **선택안: 토큰을 별도 인자로 받는 RPC 함수(`get_shared_trip(p_token uuid)`)** | RLS만으로 익명 컨텍스트에 토큰을 안전히 전달하는 방법이 제한적. RPC 함수는 SECURITY DEFINER로 토큰 유효성 + 데이터 반환을 원자적으로 처리 |

### RLS vs RPC 트레이드오프 (재검토)

이슈 본문은 "RLS 네이티브 정책" 요청. 하지만 Supabase의 anon 클라이언트가 임의의 trip을 query 할 때 토큰을 어떻게 RLS 정책에 전달하느냐가 관건이다.

**선택지 A: 순수 RLS + 세션 변수**
- 클라이언트가 매 요청 전 `select set_config('app.share_token', '<token>', true)` 호출.
- 정책: `EXISTS (SELECT 1 FROM shares WHERE shares.trip_id = trips.id AND shares.token = current_setting('app.share_token', true)::uuid AND shares.revoked_at IS NULL AND (shares.expires_at IS NULL OR shares.expires_at > now()))`.
- 장점: 표준 SELECT 그대로. PostgREST/Supabase JS와 호환.
- 단점: `set_config`를 매 요청 묶음마다 호출해야 함. anon 역할이 `set_config` 호출 가능해야 함.

**선택지 B: RPC 함수 (`get_shared_trip`)**
- 단일 RPC가 토큰 검증 + trip/items 반환.
- 장점: 원자적, 토큰 검증 누락 불가.
- 단점: 일반 SELECT API 패턴에서 벗어남. #113 페이지가 RPC 의존.

**결정: A (순수 RLS + `set_config`)** — 이슈 본문 요청에 정확히 부합. `set_config(..., true)` 는 트랜잭션 로컬이므로 안전. anon 역할의 `set_config` 호출은 Supabase에서 기본 허용.

### 헬퍼 함수

```sql
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
```

- `nullif(..., '')::uuid` — 토큰 미설정 시 안전하게 NULL.
- `current_setting(..., true)` — 미설정 시 NULL 반환(예외 없음).
- `SECURITY DEFINER` — shares 테이블의 RLS를 우회하여 정책 평가 자체는 항상 가능.

## 스키마 변경 (`supabase/migration_110_shares_table.sql`)

```sql
begin;

-- 1. shares 테이블
create table if not exists public.shares (
  token              uuid        primary key default gen_random_uuid(),
  trip_id            uuid        not null references public.trips(id) on delete cascade,
  created_by_user_id uuid        not null references auth.users(id) on delete cascade,
  created_at         timestamptz not null default now(),
  expires_at         timestamptz,
  revoked_at         timestamptz
);

create index if not exists idx_shares_trip on public.shares(trip_id);

-- 2. 헬퍼 함수
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

-- 3. shares RLS
alter table public.shares enable row level security;

drop policy if exists shares_select on public.shares;
create policy shares_select on public.shares
  for select to anon, authenticated
  using (true);  -- token 은 추측 불가, 발급된 모든 share 의 메타 조회 허용
                 -- (실제 trip 접근은 trips/items 정책에서 통제)

drop policy if exists shares_insert on public.shares;
create policy shares_insert on public.shares
  for insert to authenticated
  with check (
    public.user_role_in_trip(trip_id) = 'owner'
    and created_by_user_id = auth.uid()
  );

drop policy if exists shares_update on public.shares;
create policy shares_update on public.shares
  for update to authenticated
  using (public.user_role_in_trip(trip_id) = 'owner')
  with check (public.user_role_in_trip(trip_id) = 'owner');

drop policy if exists shares_delete on public.shares;
create policy shares_delete on public.shares
  for delete to authenticated
  using (public.user_role_in_trip(trip_id) = 'owner');

-- 4. trips SELECT 정책 갱신 — 멤버이거나 유효한 share 가 있으면 허용
drop policy if exists trips_select on public.trips;
create policy trips_select on public.trips
  for select
  using (
    public.is_trip_member(id)
    or public.share_token_grants_access(id)
  );

-- 5. items SELECT 정책 갱신
drop policy if exists items_select on public.items;
create policy items_select on public.items
  for select
  using (
    public.user_role_in_trip(trip_id) is not null
    or public.share_token_grants_access(trip_id)
  );

-- INSERT/UPDATE/DELETE 정책은 변경 없음 — 멤버(owner/editor) 전용 유지.
-- 익명 역할(anon)은 trips/items INSERT/UPDATE/DELETE 정책의 `using/with check`
-- 평가에서 auth.uid() = null 이므로 자동 차단됨.

commit;
```

**중요 — shares_select 정책 재고**: `using (true)` 는 익명이 모든 shares 행을 SELECT 가능하게 함. 토큰 자체가 PK 라 leak 위험. 보완:

```sql
drop policy if exists shares_select on public.shares;
create policy shares_select on public.shares
  for select to anon, authenticated
  using (
    -- 멤버는 자신의 trip 의 shares 메타 조회 가능
    public.is_trip_member(trip_id)
    -- 익명은 자신이 알고 있는 토큰 1건만 조회 가능
    or token = nullif(current_setting('app.share_token', true), '')::uuid
  );
```

이 정책으로 익명은 자신이 가진 토큰 한 건만 SELECT 가능, 멤버는 자기 trip 의 모든 토큰 메타 조회 가능. token enumeration 방지.

## 애플리케이션 변경 (`lib/share.ts`)

세 함수 + 클라이언트 헬퍼:

```ts
import type { SupabaseClient } from '@supabase/supabase-js'

export type Share = {
  token: string
  trip_id: string
  created_by_user_id: string
  created_at: string
  expires_at: string | null
  revoked_at: string | null
}

/** owner 가 trip 에 대해 새 share token 발급. */
export async function createShare(
  client: SupabaseClient,
  tripId: string,
  options?: { expiresAt?: Date | null },
): Promise<Share> {
  const { data: userData } = await client.auth.getUser()
  const userId = userData.user?.id
  if (!userId) throw new Error('로그인이 필요합니다.')

  const { data, error } = await client
    .from('shares')
    .insert({
      trip_id: tripId,
      created_by_user_id: userId,
      expires_at: options?.expiresAt ? options.expiresAt.toISOString() : null,
    })
    .select()
    .single()
  if (error) throw error
  return data as Share
}

/** trip 의 활성/비활성 모든 share 목록 (owner 용). */
export async function listSharesForTrip(
  client: SupabaseClient,
  tripId: string,
): Promise<Share[]> {
  const { data, error } = await client
    .from('shares')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Share[]
}

/** share token 철회 (revoked_at 기록). */
export async function revokeShare(
  client: SupabaseClient,
  token: string,
): Promise<void> {
  const { error } = await client
    .from('shares')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token', token)
  if (error) throw error
}

/**
 * 익명 클라이언트가 현재 세션에 share token 을 설정한다.
 * 같은 트랜잭션 범위(=다음 단일 쿼리)에서만 유효.
 * Supabase JS 는 각 .from(...) 호출이 별도 요청이므로, 호출 직전에 RPC 로 설정 필요.
 * → 실용적으로는 share 페이지에서 RPC 헬퍼 `set_share_context(token)` 한 번 호출 후
 *    바로 이어서 trips/items 쿼리. 본 이슈는 lib 만 제공.
 */
export async function applyShareTokenToSession(
  client: SupabaseClient,
  token: string,
): Promise<void> {
  // PostgREST 의 단일 트랜잭션 보장 — local set_config 는 그 트랜잭션 한정.
  // 따라서 후속 쿼리와 RPC 묶음 호출이 필요. #113 에서 구체 패턴 결정.
  const { error } = await client.rpc('set_share_token', { p_token: token })
  if (error) throw error
}
```

추가 RPC 함수(마이그레이션에 포함):

```sql
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
```

**주의**: PostgREST 의 connection pooling 으로 인해 `set_config(..., false)`(세션 단위) 도 쿼리 간 보장이 약하다. **`true`(transaction 단위)**가 정석이지만 그러면 후속 쿼리에 적용 안 됨. 

**대안 — 단일 RPC `get_shared_trip(p_token uuid)` 가 trip+items 한 번에 반환**: 본 이슈 범위에서는 `lib/share.ts` 의 read 헬퍼는 미구현으로 두고, 발급/조회/철회(owner 컨텍스트) 만 제공. 익명 read 경로는 #113 에서 RPC 또는 PostgREST 의 헤더 전달 방식을 확정.

### 본 이슈 최종 범위 (Plan 확정)

- ✅ `shares` 테이블 + 인덱스
- ✅ `shares` RLS (멤버 INSERT/UPDATE/DELETE, 익명 SELECT는 본인 토큰만)
- ✅ `trips`/`items` SELECT 정책에 익명 토큰 경로 추가
- ✅ 헬퍼 함수 `share_token_grants_access(trip_id)`
- ✅ 헬퍼 함수 `set_share_token(token)` (#113 에서 호출 예정)
- ✅ `lib/share.ts` — owner 컨텍스트 헬퍼(create/list/revoke) + 익명 세션 설정 헬퍼 wrapper
- ❌ 익명 read 호출 패턴 확정 (→ #113)
- ❌ UI/페이지 (→ #113)

## 검증 계획

자동화된 통합 테스트는 본 저장소에 없음(기존 컨벤션). 수동 검증 SQL(`supabase/migration_110_shares_table.sql` 하단 주석):

```sql
-- 마이그레이션 직후 검증 (Supabase SQL Editor):
-- 1. shares 테이블 존재
select count(*) from information_schema.tables where table_schema='public' and table_name='shares';  -- 1
-- 2. 헬퍼 함수 존재
select count(*) from pg_proc where proname in ('share_token_grants_access','set_share_token');  -- 2
-- 3. trips_select 정책에 share_token_grants_access 포함 여부
select polname, pg_get_expr(polqual, polrelid) from pg_policy where polrelid='public.trips'::regclass;
```

빌드/타입 게이트:
- `npm run build` (tsc + next build) — 성공 필수
- `npm run lint` — 성공 필수

## 회귀 위험

- `trips_select`/`items_select` 정책을 `drop + create`로 교체. 멤버 접근 경로(`is_trip_member`, `user_role_in_trip`)는 유지하므로 기존 사용자 영향 없음.
- `shares_select` 정책이 익명에게도 열려 있으나, `using` 조건이 본인 토큰으로 한정되어 enumeration 불가.
- `set_share_token` RPC 가 `anon`에게 grant — 세션 변수 설정 외 다른 부수효과 없음.

## Out of Scope (재확인)

- `lodgings` 테이블 — 현재 스키마에 부재. 추가하지 않음.
- 익명 read 호출 패턴 (#113 에서 RPC 단일 호출 vs `set_share_token` + 쿼리 패턴 확정).
- 공유 페이지 UI.

## 마이그레이션 파일명

`supabase/migration_110_shares_table.sql` — 기존 `migration_NNN_*.sql` 컨벤션. 번호는 이슈 번호 그대로.
