# Quickstart — RLS + trip_members 적용/검증

## 사전 조건

- Supabase 프로젝트 `onzkrbyokomdpjtuvbcy` 가 active 상태
- `auth.users` 에 `chanhee13p@gmail.com` 엔트리 존재 (#107 에서 가입 완료)
- 로컬 `npm run dev` 가 동작

## 1. 마이그레이션 적용 (운영 DB)

1. Supabase 대시보드 → SQL Editor 열기
2. `supabase/migration_108_rls_trip_members.sql` 전체 복사 → 실행
3. 결과 확인:
   ```sql
   select count(*) from trips;          -- 1
   select count(*) from trip_members;   -- 1
   select count(*) from items where trip_id is null;  -- 0
   ```

마이그레이션 실패 시 (예: `auth.users` 에 이메일 없음) 트랜잭션이 롤백되어 데이터 변경 없음.

## 2. 앱 동작 확인 (P1: 마이그레이션 회귀 없음)

1. `npm run dev` 시작
2. `chanhee13p@gmail.com` 으로 로그인
3. 메인 화면에서 items 목록이 마이그레이션 전과 동일하게 보임을 확인
4. 새 item 추가 → 정상 저장 → 새로고침 후에도 보임

## 3. 격리 검증 (P1: 다른 사용자는 못 봄)

SQL Editor 에서 시뮬레이션:

```sql
-- 다른 사용자 id 로 RLS 평가
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"00000000-0000-0000-0000-000000000000","role":"authenticated"}';

select count(*) from items;           -- 0 이어야 함
select count(*) from trips;           -- 0 이어야 함
select count(*) from trip_members;    -- 0 이어야 함
```

또는 두 번째 테스트 계정 가입 후 로그인해서 items 목록이 비어있는지 확인.

## 4. 권한 강제 검증 (P1: 쓰기 거부)

위 시뮬레이션 컨텍스트에서:

```sql
insert into items (id, name, category, status, trip_id, created_at, updated_at)
  values ('test', 'test', '기타', '검토 필요',
          (select id from trips limit 1),  -- chanhee13p 의 trip
          now()::text, now()::text);
-- → "new row violates row-level security policy" 에러
```

## 5. 신규 사용자 흐름 (P2)

1. 새 이메일로 가입 (`/signup`)
2. 인증 후 메인 화면 진입
3. 자동으로 빈 trip "내 여행" 이 생성되어 빈 items 목록이 보임
4. item 1개 추가 → 정상

## 6. 롤백 계획

문제 발생 시:

```sql
begin;
alter table items drop column trip_id;
drop policy if exists ... on items;
drop policy if exists ... on trip_members;
drop policy if exists ... on trips;
drop table if exists trip_members;
drop table if exists trips;
drop function if exists user_role_in_trip;
drop function if exists is_trip_member;
alter table items enable row level security; -- 기존 상태로
commit;
```

그 후 `lib/data.ts` 변경을 git revert 하고 `SUPABASE_SERVICE_KEY` 환경변수 확인.
