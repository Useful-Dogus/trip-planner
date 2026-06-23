-- #259 항목 보류/탈락 사유 한 줄 캡처
-- "이거 왜 뺐더라"를 남겨 결정 이력을 자산화한다 (독점 데이터 루프 입력, 소비처 #262).
-- nullable — 선택 입력이라 기존 항목 마이그레이션은 무해(전부 NULL 유지).

alter table public.items
  add column if not exists decision_reason text;
