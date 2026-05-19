-- 일회성 마이그레이션: 기존 단일 사용자/단일 trip 데이터 보존하며 RLS + trip_members 도입.
-- Supabase SQL Editor 에서 한 번 실행. 트랜잭션 내에서 처리되어 부분 실패 시 롤백.
-- 사전 조건: auth.users 에 chanhee13p@gmail.com 엔트리 존재.

begin;

-- ---------------------------------------------------------------------------
-- 1. owner 사용자 식별 (없으면 트랜잭션 중단)
-- ---------------------------------------------------------------------------

do $$
declare
  v_owner_id uuid;
begin
  select id into v_owner_id from auth.users where email = 'chanhee13p@gmail.com';
  if v_owner_id is null then
    raise exception 'auth.users 에 chanhee13p@gmail.com 이 없습니다. 마이그레이션 중단.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. 테이블 생성 (trips, trip_members)
-- ---------------------------------------------------------------------------

create table if not exists public.trips (
  id            uuid        primary key default gen_random_uuid(),
  owner_user_id uuid        not null references auth.users(id) on delete cascade,
  title         text        not null default '내 여행',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_trips_owner on public.trips(owner_user_id);

create table if not exists public.trip_members (
  trip_id    uuid        not null references public.trips(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  role       text        not null check (role in ('owner', 'editor', 'viewer')),
  invited_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create index if not exists idx_trip_members_user on public.trip_members(user_id);

-- ---------------------------------------------------------------------------
-- 3. default trip + owner 멤버십 시드
-- ---------------------------------------------------------------------------

with owner_lookup as (
  select id as user_id from auth.users where email = 'chanhee13p@gmail.com'
),
new_trip as (
  insert into public.trips (owner_user_id, title)
  select user_id, '내 여행' from owner_lookup
  returning id, owner_user_id
)
insert into public.trip_members (trip_id, user_id, role)
select id, owner_user_id, 'owner' from new_trip;

-- ---------------------------------------------------------------------------
-- 4. items.trip_id 추가 + 기존 데이터 채움
-- ---------------------------------------------------------------------------

alter table public.items add column if not exists trip_id uuid references public.trips(id) on delete cascade;

update public.items
set trip_id = (
  select t.id from public.trips t
  join auth.users u on u.id = t.owner_user_id
  where u.email = 'chanhee13p@gmail.com'
  limit 1
)
where trip_id is null;

alter table public.items alter column trip_id set not null;

create index if not exists idx_items_trip on public.items(trip_id);

-- ---------------------------------------------------------------------------
-- 5. 헬퍼 함수 (RLS 재귀 회피)
-- ---------------------------------------------------------------------------

create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists(
    select 1 from public.trip_members
    where trip_id = p_trip_id and user_id = auth.uid()
  )
$$;

create or replace function public.user_role_in_trip(p_trip_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.trip_members
  where trip_id = p_trip_id and user_id = auth.uid()
  limit 1
$$;

revoke all on function public.is_trip_member(uuid) from public, anon;
revoke all on function public.user_role_in_trip(uuid) from public, anon;
grant execute on function public.is_trip_member(uuid) to authenticated;
grant execute on function public.user_role_in_trip(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. RLS 정책 적용
-- ---------------------------------------------------------------------------

alter table public.trips         enable row level security;
alter table public.trip_members  enable row level security;
alter table public.items         enable row level security;

drop policy if exists trips_select on public.trips;
create policy trips_select on public.trips
  for select using (public.is_trip_member(id));

drop policy if exists trips_insert on public.trips;
create policy trips_insert on public.trips
  for insert with check (owner_user_id = auth.uid());

drop policy if exists trips_update on public.trips;
create policy trips_update on public.trips
  for update using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists trips_delete on public.trips;
create policy trips_delete on public.trips
  for delete using (owner_user_id = auth.uid());

drop policy if exists trip_members_select on public.trip_members;
create policy trip_members_select on public.trip_members
  for select using (public.is_trip_member(trip_id));

drop policy if exists trip_members_insert on public.trip_members;
create policy trip_members_insert on public.trip_members
  for insert with check (
    public.user_role_in_trip(trip_id) = 'owner'
    or (select owner_user_id from public.trips where id = trip_id) = auth.uid()
  );

drop policy if exists trip_members_update on public.trip_members;
create policy trip_members_update on public.trip_members
  for update using (public.user_role_in_trip(trip_id) = 'owner')
  with check (public.user_role_in_trip(trip_id) = 'owner');

drop policy if exists trip_members_delete on public.trip_members;
create policy trip_members_delete on public.trip_members
  for delete using (public.user_role_in_trip(trip_id) = 'owner');

drop policy if exists items_select on public.items;
create policy items_select on public.items
  for select using (public.user_role_in_trip(trip_id) is not null);

drop policy if exists items_insert on public.items;
create policy items_insert on public.items
  for insert with check (public.user_role_in_trip(trip_id) in ('owner', 'editor'));

drop policy if exists items_update on public.items;
create policy items_update on public.items
  for update using (public.user_role_in_trip(trip_id) in ('owner', 'editor'))
  with check (public.user_role_in_trip(trip_id) in ('owner', 'editor'));

drop policy if exists items_delete on public.items;
create policy items_delete on public.items
  for delete using (public.user_role_in_trip(trip_id) in ('owner', 'editor'));

commit;

-- 검증 쿼리 (별도로 실행):
--   select count(*) from public.trips;                            -- 1
--   select count(*) from public.trip_members;                     -- 1
--   select count(*) from public.items where trip_id is null;      -- 0
