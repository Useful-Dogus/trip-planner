-- #112 슬라이스 C: trip 메타데이터 컬럼 추가.
-- 마법사가 채울 필드들. 모두 nullable — 기존 trip 은 그대로 두고
-- 사용자가 편집 UI 에서 채우게 한다.
--
-- Supabase SQL Editor 에서 1회 실행. 이미 적용된 환경에서 재실행해도 안전.

begin;

alter table public.trips add column if not exists start_date       date;
alter table public.trips add column if not exists end_date         date;
alter table public.trips add column if not exists region           text;
alter table public.trips add column if not exists basecamp_address text;

-- 마법사 전용 RPC. SECURITY DEFINER 로 trips + trip_members 를 한 트랜잭션에 묶는다.
-- 기존 create_user_trip 은 그대로 두고 (단일 trip 자동 생성용) 추가 RPC 를 도입.
create or replace function public.create_trip_v2(
  p_title            text,
  p_start_date       date default null,
  p_end_date         date default null,
  p_region           text default null,
  p_basecamp_address text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_trip_id uuid;
  v_title   text := coalesce(nullif(trim(p_title), ''), '새 여행');
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if p_start_date is not null and p_end_date is not null and p_end_date < p_start_date then
    raise exception 'end_date must be on or after start_date';
  end if;

  insert into public.trips (
    owner_user_id, title, start_date, end_date, region, basecamp_address
  )
  values (
    v_user_id, v_title, p_start_date, p_end_date,
    nullif(trim(coalesce(p_region, '')), ''),
    nullif(trim(coalesce(p_basecamp_address, '')), '')
  )
  returning id into v_trip_id;

  insert into public.trip_members (trip_id, user_id, role)
  values (v_trip_id, v_user_id, 'owner');

  return v_trip_id;
end;
$$;

revoke all on function public.create_trip_v2(text, date, date, text, text) from public, anon;
grant execute on function public.create_trip_v2(text, date, date, text, text) to authenticated;

commit;
