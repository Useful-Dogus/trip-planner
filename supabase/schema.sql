-- Supabase SQL Editor에서 실행하세요.

create table public.items (
  id          text        primary key,
  name        text        not null,
  category    text        not null,
  status      text        not null,
  priority    text,
  address     text,
  lat         double precision,
  lng         double precision,
  links       jsonb       not null default '[]',
  budget      integer,
  memo        text,
  date        text,
  time_start  text,
  time_end    text,
  is_franchise     boolean,
  branches         jsonb,
  google_place_id  text,
  created_at       text        not null,
  updated_at       text        not null
);

-- Row Level Security 비활성화 (서버사이드에서만 접근)
alter table public.items disable row level security;
