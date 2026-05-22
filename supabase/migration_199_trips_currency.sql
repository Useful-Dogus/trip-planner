-- #199 trip 단위 currency 도입.
-- 기존 USD 고정에서 벗어나, trip 별로 표시·입력 통화를 갖는다.
-- 기존 trip 은 한국 사용자 비중을 고려하여 일괄 'KRW' 로 초기화.
--
-- Supabase SQL Editor 에서 1회 실행. 재실행 안전.

begin;

alter table public.trips
  add column if not exists currency varchar(3) not null default 'KRW';

-- 기존 데이터: 컬럼 추가 시 default 가 적용되지만, 명시적으로 한 번 더 보정.
update public.trips set currency = 'KRW' where currency is null;

commit;
