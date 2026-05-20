-- Issue #113 — 공유 페이지용 단일 RPC.
-- 사전 조건: migration_110_shares_table.sql 이 적용되어 있어야 한다.
--
-- PostgREST 의 single-request-single-transaction 모델에서는 set_share_token + 후속 쿼리가
-- 보장되지 않으므로, 토큰 검증 + trip + items 를 한 번에 반환하는 SECURITY DEFINER RPC 로 처리한다.
-- 토큰이 무효(존재 X / 만료 / 철회) 이면 null 을 반환한다.

begin;

create or replace function public.get_shared_trip(p_token uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_trip_id uuid;
  v_result jsonb;
begin
  if p_token is null then
    return null;
  end if;

  select s.trip_id
    into v_trip_id
    from public.shares s
   where s.token = p_token
     and s.revoked_at is null
     and (s.expires_at is null or s.expires_at > now())
   limit 1;

  if v_trip_id is null then
    return null;
  end if;

  select jsonb_build_object(
    'trip', to_jsonb(t.*),
    'items', coalesce((
      select jsonb_agg(
               to_jsonb(i.*)
               order by i.date nulls last, i.time_start nulls last, i.created_at
             )
        from public.items i
       where i.trip_id = v_trip_id
    ), '[]'::jsonb)
  )
    into v_result
    from public.trips t
   where t.id = v_trip_id;

  return v_result;
end
$$;

revoke all on function public.get_shared_trip(uuid) from public;
grant execute on function public.get_shared_trip(uuid) to anon, authenticated;

commit;

-- 검증 쿼리 (마이그레이션 직후):
--   -- 함수 존재 확인
--   select proname, pronargs from pg_proc where proname = 'get_shared_trip';   -- 1 row
--
--   -- 무효 토큰 → null
--   select public.get_shared_trip('00000000-0000-0000-0000-000000000000'::uuid);
--
--   -- 유효 토큰 (실제 발급된 token 대입)
--   select public.get_shared_trip('<token>'::uuid);
