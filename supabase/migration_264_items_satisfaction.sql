-- #264 여행 후 만족도 피드백 캡처
-- 다녀온 항목의 "실제로 좋았나"를 남겨 다음 추천 가중치 입력으로 쓴다(소비처 #262).
-- nullable — 선택 입력이라 기존 항목 마이그레이션은 무해(전부 NULL 유지).
-- 값: '좋았어요' | '괜찮아요' | '아쉬웠어요' (애플리케이션 레벨에서 검증).

alter table public.items
  add column if not exists satisfaction text;
