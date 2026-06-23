-- #261 예약 마감·마지막 입장 시각
-- 마지막 입장 시각(HH:MM)·예약 마감일(YYYY-MM-DD)을 담아 일정 위반 시 경고한다.
-- 둘 다 nullable·선택 입력 — 기존 항목 마이그레이션은 무해(전부 NULL).

alter table public.items
  add column if not exists last_entry_time text,
  add column if not exists reservation_deadline text;
