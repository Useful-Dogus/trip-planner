-- 신규 사용자의 첫 trip 생성을 원자화. RLS 경합 회피.
--
-- 배경: ensureActiveTrip 이 trips.insert 후 trip_members.insert 를 별도로 수행하면
-- trips_select RLS 정책(is_trip_member 기반)이 INSERT..RETURNING 단계에서 막혀
-- PostgREST 가 403 을 반환하는 경우가 발생. RPC 한 번으로 처리하면 RLS 가 우회되고
-- (SECURITY DEFINER), 두 insert 가 단일 트랜잭션에 묶인다.
--
-- Supabase SQL Editor 에서 1회 실행. 이미 적용된 환경에서 재실행해도 안전.

begin;

create or replace function public.create_user_trip(p_title text default '내 여행')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_trip_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  insert into public.trips (owner_user_id, title)
  values (v_user_id, p_title)
  returning id into v_trip_id;

  insert into public.trip_members (trip_id, user_id, role)
  values (v_trip_id, v_user_id, 'owner');

  return v_trip_id;
end;
$$;

revoke all on function public.create_user_trip(text) from public, anon;
grant execute on function public.create_user_trip(text) to authenticated;

-- RLS 위에 테이블 권한도 함께 보장 (Supabase 기본 default privilege 누락 대비)
grant select, insert, update, delete on public.trips         to authenticated;
grant select, insert, update, delete on public.trip_members  to authenticated;
grant select, insert, update, delete on public.items         to authenticated;

commit;

-- 검증:
--   select pg_get_functiondef('public.create_user_trip(text)'::regprocedure);
