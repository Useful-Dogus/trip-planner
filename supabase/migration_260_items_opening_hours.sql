-- #260(a) 영업시간·휴무 수동 입력 + 일정 충돌 경고
-- 외부 데이터 연동 전, 수동 입력 폴백 경로부터 닫는다. crowd-correction 축적(#260b)은 후속.
--   opening_hours: {"open":"HH:MM","close":"HH:MM"} (jsonb, 단순 영업시간)
--   closed_days:   [0..6] 휴무 요일 (0=일 .. 6=토, jsonb int 배열)
-- 둘 다 nullable — 정보 없는 항목은 NULL 로 두어 "정보 없음"(오탐 방지)으로 처리한다.

alter table public.items
  add column if not exists opening_hours jsonb,
  add column if not exists closed_days   jsonb;
