-- Supabase SQL Editor에서 실행하세요.

create table public.items (
  id          text        primary key,
  name        text        not null,
  category    text        not null,
  status      text        not null,
  reservation_status text,
  priority    text,
  address     text,
  lat         double precision,
  lng         double precision,
  links       jsonb       not null default '[]',
  budget      integer,
  memo        text,
  date        text,
  end_date    text,
  time_start  text,
  time_end    text,
  is_franchise     boolean,
  branches         jsonb,
  google_place_id  text,
  created_at       text        not null,
  updated_at       text        not null
);

-- Row Level Security 활성화 (서버사이드에서 service role key로만 접근)
-- service role key는 RLS를 우회하므로 별도 정책 없이도 서버에서 정상 동작
alter table public.items enable row level security;
