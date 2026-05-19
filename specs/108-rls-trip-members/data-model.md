# Data Model — RLS + trip_members

## Tables

### `trips`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | trip 식별자 |
| `owner_user_id` | `uuid` | NOT NULL, FK `auth.users(id) ON DELETE CASCADE` | trip 의 owner. 빠른 RLS 평가용 보조 컬럼. |
| `title` | `text` | NOT NULL, default `'내 여행'` | trip 제목 |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | 생성 시각 |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | 마지막 수정 시각 |

Indexes: `idx_trips_owner` on `owner_user_id`.

### `trip_members`

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `trip_id` | `uuid` | NOT NULL, FK `trips(id) ON DELETE CASCADE` | 소속 trip |
| `user_id` | `uuid` | NOT NULL, FK `auth.users(id) ON DELETE CASCADE` | 멤버 |
| `role` | `text` | NOT NULL, CHECK `in ('owner','editor','viewer')` | 역할 |
| `invited_at` | `timestamptz` | NOT NULL, default `now()` | 초대(=레코드 생성) 시각 |

PK: `(trip_id, user_id)`. Indexes: `idx_trip_members_user` on `user_id`.

### `items` (기존 + 추가)

추가 컬럼:

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `trip_id` | `uuid` | NOT NULL, FK `trips(id) ON DELETE CASCADE` | 소속 trip |

Indexes: `idx_items_trip` on `trip_id`.

기존 모든 컬럼은 그대로 유지.

## Helper Functions

### `public.is_trip_member(p_trip_id uuid) returns boolean`

`SECURITY DEFINER`, `STABLE`. `trip_members` 에 `(p_trip_id, auth.uid())` 가 존재하는지 반환. RLS 재귀 회피용.

### `public.user_role_in_trip(p_trip_id uuid) returns text`

`SECURITY DEFINER`, `STABLE`. 현 사용자의 해당 trip 에서 역할을 반환. 멤버가 아니면 `null`.

권한:
- 함수는 `public` 스키마에 생성.
- `grant execute ... to authenticated` (anon 에는 grant 하지 않는다).

## RLS 정책 매트릭스

| 테이블 | 작업 | USING / WITH CHECK |
|---|---|---|
| trips | SELECT | `is_trip_member(id)` |
| trips | INSERT | with check: `owner_user_id = auth.uid()` |
| trips | UPDATE | `owner_user_id = auth.uid()` (using + with check) |
| trips | DELETE | `owner_user_id = auth.uid()` |
| trip_members | SELECT | `is_trip_member(trip_id)` |
| trip_members | INSERT | with check: `user_role_in_trip(trip_id) = 'owner'` 또는 `(select owner_user_id from trips where id = trip_id) = auth.uid()` (생성 직후 owner 자기 자신 INSERT 케이스 처리) |
| trip_members | UPDATE | `user_role_in_trip(trip_id) = 'owner'` |
| trip_members | DELETE | `user_role_in_trip(trip_id) = 'owner'` |
| items | SELECT | `user_role_in_trip(trip_id) is not null` |
| items | INSERT | with check: `user_role_in_trip(trip_id) in ('owner','editor')` |
| items | UPDATE | `user_role_in_trip(trip_id) in ('owner','editor')` |
| items | DELETE | `user_role_in_trip(trip_id) in ('owner','editor')` |

## Bootstrap Edge Case — owner 자기 자신 INSERT

`trips` 생성 직후 같은 트랜잭션에서 `trip_members(trip_id, owner, 'owner')` INSERT 가 필요하다. 이 시점에는 아직 멤버십이 없어 `user_role_in_trip(trip_id) = 'owner'` 가 거짓이 된다.

**해결**: trip_members INSERT 정책의 with check 를 다음 OR 로 구성한다.

```sql
(
  user_role_in_trip(trip_id) = 'owner'
  or
  (select owner_user_id from public.trips where id = trip_id) = auth.uid()
)
```

`trips.owner_user_id` 는 RLS 정책 평가 시 동일 사용자 본인이 만든 행이므로 SELECT 가 가능하다. 두 번째 분기로 부트스트랩이 가능.

## State Transitions

본 스펙에는 상태 머신이 없다. 역할 변경/탈퇴 UX 는 후속 이슈에서 다룬다.
