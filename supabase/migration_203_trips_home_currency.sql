-- #203 trip 별 home_currency 환산 (수동 환율 MVP)
-- 사용자가 머릿속으로 환산하지 않도록 합계 옆 부가 표시용.
-- 둘 다 null 가능 (미설정 시 환산 표시 숨김).
--
-- Supabase SQL Editor 에서 1회 실행. 재실행 안전.

begin;

alter table public.trips
  add column if not exists home_currency varchar(3) null,
  add column if not exists home_currency_rate numeric null;

-- 양/음수 검증: rate 는 양수만 의미가 있다.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'trips_home_currency_rate_positive'
  ) then
    alter table public.trips
      add constraint trips_home_currency_rate_positive
      check (home_currency_rate is null or home_currency_rate > 0);
  end if;
end $$;

commit;
