-- Supabase SQL Editor 에서 실행하세요.
-- 신규 호스트(또는 빈 스키마)에 처음부터 적용할 때 사용하는 권위 있는 정의.
-- 운영 DB 에 이미 데이터가 있는 경우 migration_108_rls_trip_members.sql 을 대신 사용한다.

-- ============================================================================
-- Tables
-- ============================================================================

create table if not exists public.trips (
  id               uuid        primary key default gen_random_uuid(),
  owner_user_id    uuid        not null references auth.users(id) on delete cascade,
  title            text        not null default '내 여행',
  start_date       date,
  end_date         date,
  region           text,
  basecamp_address text,
  center_lat       double precision,
  center_lng       double precision,
  default_zoom     smallint,
  center_source    text        check (center_source in ('auto', 'manual')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
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

create table if not exists public.items (
  id          text        primary key,
  trip_id     uuid        not null references public.trips(id) on delete cascade,
  name        text        not null,
  category    text        not null default '기타',
  status      text        not null default '검토 필요',
  reservation_status text,
  priority    text,
  address     text,
  lat         double precision,
  lng         double precision,
  links       jsonb       not null default '[]',
  budget      integer,
  memo        text,
  decision_reason text,
  satisfaction text,
  date        text,
  end_date    text,
  time_start  text,
  time_end    text,
  last_entry_time      text,
  reservation_deadline text,
  opening_hours    jsonb,
  closed_days      jsonb,
  is_franchise     boolean,
  branches         jsonb,
  google_place_id  text,
  created_at       text        not null,
  updated_at       text        not null
);

create index if not exists idx_items_trip on public.items(trip_id);

-- ============================================================================
-- RLS 재귀 회피용 헬퍼 함수 (SECURITY DEFINER)
-- ============================================================================

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

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.trips         enable row level security;
alter table public.trip_members  enable row level security;
alter table public.items         enable row level security;

-- trips: 멤버만 SELECT, 본인이 owner 인 경우만 INSERT/UPDATE/DELETE
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

-- trip_members: 같은 trip 의 멤버만 SELECT, owner 만 INSERT/UPDATE/DELETE
-- INSERT 는 부트스트랩(owner 자기 자신을 막 생성한 trip 에 추가)을 위해 trips.owner_user_id OR 분기 포함
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

-- items: viewer 이상 SELECT, editor 이상 INSERT/UPDATE/DELETE
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
