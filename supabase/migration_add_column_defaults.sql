-- category, status(=trip_priority) 컬럼에 DEFAULT 추가
-- Supabase SQL Editor에서 실행하세요.

alter table public.items
  alter column category set default '기타';

alter table public.items
  alter column status set default '검토 필요';
