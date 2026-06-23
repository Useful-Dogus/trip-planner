-- #278 영업시간·휴무 crowd-correction 축적 (해자 본체)
-- 한 사용자의 "정보 틀려요" 수정을 google_place_id 기준 전역 공유 테이블에 append.
-- 영업시간은 개인정보 아닌 공개 사실 → 로그인 사용자 전역 읽기, 본인 작성만 쓰기.
-- append-only(감사·신뢰도): 같은 장소의 최신 레코드가 현재값, 누적 수가 신뢰 신호.

create table if not exists public.place_hours_corrections (
  id              uuid        primary key default gen_random_uuid(),
  google_place_id text        not null,
  opening_hours   jsonb,
  closed_days     jsonb,
  author_user_id  uuid        not null references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now()
);

create index if not exists idx_phc_place
  on public.place_hours_corrections(google_place_id, created_at desc);

alter table public.place_hours_corrections enable row level security;

-- 로그인 사용자는 모두 읽기(공유 사실).
drop policy if exists phc_select on public.place_hours_corrections;
create policy phc_select on public.place_hours_corrections
  for select using (auth.uid() is not null);

-- 본인이 작성한 행만 insert(작성자 위조 방지). update/delete 없음(append-only).
drop policy if exists phc_insert on public.place_hours_corrections;
create policy phc_insert on public.place_hours_corrections
  for insert with check (author_user_id = auth.uid());
