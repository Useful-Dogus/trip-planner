-- #221 trip 단위 지도 중심점·줌 저장.
-- 단일-trip 시대의 일본 좌표 하드코딩 폴백을 제거하고,
-- trip 별 도시 정체성을 데이터화한다.
--   center_lat/center_lng : 지도 초기 중심 좌표 (nullable — 비면 region preset / fallback)
--   default_zoom          : 도시 레벨 줌 (nullable)
--   center_source         : 'auto'(사전·지오코딩 자동) | 'manual'(사용자 "여기를 중심으로")
--                           null = 좌표 없음. manual 가드로 자동 계산 덮어쓰기 방지에 사용.
-- 기존 RLS(trips_*) 가 유저 격리를 자동 상속하므로 추가 정책 불필요.
--
-- Supabase SQL Editor 에서 1회 실행. 재실행 안전.

begin;

alter table public.trips
  add column if not exists center_lat    double precision,
  add column if not exists center_lng    double precision,
  add column if not exists default_zoom  smallint,
  add column if not exists center_source text
    check (center_source in ('auto', 'manual'));

commit;
