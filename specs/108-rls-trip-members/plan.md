# Implementation Plan: RLS + trip_members

**Branch**: `issue/108-rls-trip-members` | **Date**: 2026-05-19 | **Spec**: [spec.md](./spec.md)
**Issue**: [#108](https://github.com/Useful-Dogus/trip-planner/issues/108)

## Summary

`trips`, `trip_members` 테이블을 도입하고 `items.trip_id` 를 추가해 다중 사용자 데이터 모델로 전환한다. 권한 강제는 애플리케이션이 아닌 DB(RLS) 가 담당한다. 기존 단일 사용자(chanhee13p@gmail.com)의 모든 items 는 일회성 마이그레이션 SQL 로 "내 여행" trip 한 개로 묶고 그 사용자를 owner 로 지정한다. RLS 가 실제로 평가되도록 `lib/data.ts` 의 자격증명을 service_role 키에서 사용자 세션 기반 anon 클라이언트로 전환한다.

## Technical Context

- **Language/Version**: TypeScript 5.x, Node.js 18+
- **Primary Dependencies**: Next.js 14 (App Router), React 18, `@supabase/supabase-js` ^2.100, `@supabase/ssr`
- **Storage**: Supabase PostgreSQL (project ID `onzkrbyokomdpjtuvbcy`)
- **Testing**: 본 작업은 자동화 테스트 없음. 수동 검증(quickstart.md).
- **Target Platform**: Vercel (Next.js Edge/Node)
- **Project Type**: Web application (단일 Next.js 앱)
- **Scale/Scope**: 단일 사용자/단일 trip 환경. 멀티 trip UX(#112)는 후속.

## Constitution Check

- **단일 Next.js + Supabase 네이티브 원칙(#121 결정)**: ✅ 유지. 추가 인프라 도입 없음.
- **얇은 어댑터 레이어**: ✅ `lib/data.ts`, `lib/trip.ts` 에 격리. RLS 정책은 `supabase/schema.sql` 단일 파일에 집중.
- **벤더 이전성**: ✅ RLS + 표준 Postgres 기능만 사용. SECURITY DEFINER 함수 1-2개는 일반 PostgreSQL.

## Project Structure

```text
supabase/
├── schema.sql                            # 신규 테이블/RLS/헬퍼 함수 전체 정의 (수정)
└── migration_108_rls_trip_members.sql    # 운영 DB 적용용 일회성 마이그레이션 (신규)

lib/
├── data.ts          # service_role → 사용자 세션 클라이언트로 전환
├── trip.ts          # 신규: ensureActiveTrip / getActiveTripId / getUserRole
└── supabase-server.ts  # 이미 존재. 재사용.

app/
├── api/items/route.ts            # 호출부 갱신
├── api/items/[id]/route.ts       # 호출부 갱신
├── api/gmaps/preview/route.ts    # 호출부 갱신
├── api/gmaps/import/route.ts     # 호출부 갱신
├── items/[id]/page.tsx           # 호출부 갱신 (서버 컴포넌트)
└── items/[id]/edit/page.tsx      # 호출부 갱신 (서버 컴포넌트)
```

## Phase 0 — Research

### R1. RLS 무한 재귀 회피

`trip_members` 의 RLS 정책이 "같은 trip 의 멤버" 를 확인하려고 `trip_members` 자체에 SELECT 를 거는 순간 무한 재귀에 빠진다. 검색해보면 표준 해결책은 `SECURITY DEFINER` 함수로 우회하는 것.

**Decision**: 다음 두 헬퍼 함수를 `public` 스키마에 `SECURITY DEFINER` 로 만든다.

```sql
-- 현 사용자가 해당 trip 의 멤버인가
create function public.is_trip_member(p_trip_id uuid) returns boolean
  language sql security definer stable
  as $$ select exists(select 1 from public.trip_members where trip_id = p_trip_id and user_id = auth.uid()) $$;

-- 현 사용자의 해당 trip 에서의 역할 ('owner' | 'editor' | 'viewer' | null)
create function public.user_role_in_trip(p_trip_id uuid) returns text
  language sql security definer stable
  as $$ select role from public.trip_members where trip_id = p_trip_id and user_id = auth.uid() $$;
```

이 함수들은 정의자 권한으로 실행되어 RLS 를 우회한다. 호출 입력은 `auth.uid()` 만 사용해 인젝션 위험 없음.

**Rationale**: SQL 내장 재귀 회피의 정석. supabase 공식 문서가 권장하는 패턴.

**Alternatives**: trips.owner_user_id 컬럼만 사용하는 단순 정책 (owner-only 모델) — viewer/editor 표현 불가, 향후 #110/#113 에서 깨짐.

### R2. 신규 사용자의 기본 trip 생성 시점

**Decision**: 앱 레벨 lazy 생성. `lib/trip.ts/ensureActiveTrip()` 가 서버 요청 진입 시 호출되어 멤버십 0개면 "내 여행" 1개를 생성.

**Rationale**: DB 트리거는 (1) 마이그레이션 이전성이 떨어지고 (2) 디버깅이 어려우며 (3) 첫 로그인 콜백을 굳이 트리거에 묶을 이유가 없다.

**Alternatives**: `auth.users` AFTER INSERT 트리거 — 위 단점.

### R3. lib/data.ts 의 클라이언트 전환

현재 `getSupabaseClient()` 가 `SUPABASE_SERVICE_KEY` 로 익명 service-role 클라이언트를 매 호출마다 생성. RLS 우회.

**Decision**:
- 라우트 핸들러: 기존 `createRouteHandlerSupabase()` (lib/supabase-server.ts) 사용 — 쿠키 기반 사용자 세션.
- 서버 컴포넌트: 동일 SSR 패턴 사용. `cookies()` 가 RSC 에서 read-only 라 set 은 swallow.
- `lib/data.ts` 의 `readItems()`, `writeItems()` 등 모든 함수가 **클라이언트를 인자로 받는** 시그니처로 바꾼다. 자동 스코프는 함수 내부에서 `getActiveTripId(client)` 로 결정.

```ts
// 새 시그니처
export async function readItems(client: SupabaseServerClient): Promise<TripItem[]>
export async function writeItems(client: SupabaseServerClient, items: TripItem[]): Promise<void>
export async function getItem(client: SupabaseServerClient, id: string): Promise<TripItem | null>
```

호출부는 자기 컨텍스트(RouteHandler vs ServerComponent)에 맞는 클라이언트를 만들어 전달.

**Rationale**: 클라이언트를 함수 내부에서 만들면 컨텍스트(쿠키 store 접근 모드)를 자동 추론할 수 없다. 명시 인자로 받는 게 깔끔.

**Alternatives**: `lib/data.ts` 안에서 자동 추론 — `next/headers/cookies()` 가 RSC 와 라우트 핸들러 모두에서 동작하긴 함. 다만 명시적 의존성이 가독성에 유리.

### R4. 마이그레이션 owner 식별

**Decision**: 마이그레이션 SQL 내에서 `(select id from auth.users where email = 'chanhee13p@gmail.com')` 로 동적 조회. NOT FOUND 면 `RAISE EXCEPTION` 으로 트랜잭션 롤백.

**Rationale**: SQL 파일에 user UUID 를 하드코딩하면 호스트 이전 시 깨진다. 이메일은 자연 식별자.

**Alternatives**: env var 로 UUID 주입 — SQL 파일 재사용성 떨어짐.

### R5. items.trip_id 추가 순서

**Decision**: 단일 트랜잭션 내에서
1. `trips`, `trip_members` 생성
2. owner 트립 1건 INSERT, owner 멤버십 1건 INSERT
3. `items.trip_id` nullable 컬럼 추가
4. 모든 기존 items 의 trip_id 를 1번 트립으로 UPDATE
5. `items.trip_id` NOT NULL + FK ON DELETE CASCADE 설정

**Rationale**: 한 트랜잭션이면 부분 실패가 없다. items 가 N=수십~수백 단위라 LOCK 시간 무시 가능.

## Phase 1 — Design

### Data Model

[`data-model.md`](./data-model.md) 참조.

요약:
- `trips(id uuid pk, owner_user_id uuid not null fk auth.users, title text, created_at, updated_at)`
- `trip_members(trip_id uuid fk trips on delete cascade, user_id uuid fk auth.users, role text check in ('owner','editor','viewer'), invited_at, primary key (trip_id, user_id))`
- `items.trip_id uuid not null fk trips on delete cascade` (신규 컬럼)

### RLS 정책

- **trips**
  - SELECT: `is_trip_member(id)` 또는 `owner_user_id = auth.uid()`
  - INSERT: `owner_user_id = auth.uid()` (with check)
  - UPDATE: `owner_user_id = auth.uid()`
  - DELETE: `owner_user_id = auth.uid()`

- **trip_members**
  - SELECT: `is_trip_member(trip_id)`
  - INSERT/UPDATE/DELETE: 해당 trip 의 owner. `user_role_in_trip(trip_id) = 'owner'`

- **items**
  - SELECT: `user_role_in_trip(trip_id) is not null` (viewer 이상)
  - INSERT: `user_role_in_trip(trip_id) in ('owner','editor')` (with check)
  - UPDATE: `user_role_in_trip(trip_id) in ('owner','editor')`
  - DELETE: `user_role_in_trip(trip_id) in ('owner','editor')`

### Application Contracts

`lib/trip.ts` 신규 API:

```ts
export async function getActiveTripId(client: SupabaseServerClient): Promise<string | null>
export async function ensureActiveTrip(client: SupabaseServerClient): Promise<string>
export async function getUserRole(client: SupabaseServerClient, tripId: string): Promise<TripRole | null>
export type TripRole = 'owner' | 'editor' | 'viewer'
```

`lib/data.ts` 변경:
- `getSupabaseClient()` 삭제
- 모든 export 함수가 `client` 를 첫 인자로 받음
- `readItems/writeItems/getItem/upsertItem/deleteItem` 내부에서 `ensureActiveTrip(client)` 호출해 활성 trip 으로 자동 스코프

## Phase 2 — Implementation Order (commits)

1. **DB 스키마 + RLS**: `supabase/schema.sql` 갱신, `supabase/migration_108_rls_trip_members.sql` 생성.
2. **lib/trip.ts**: 활성 trip 헬퍼.
3. **lib/data.ts 리팩터**: 사용자 세션 클라이언트 전환 + trip 자동 스코프.
4. **호출부 갱신**: 7개 파일에서 client 주입.
5. **수동 검증**: quickstart.md 시나리오.

## Risks & Mitigations

| 리스크 | 영향 | 완화 |
|---|---|---|
| RLS 정책 오류로 본인 데이터도 안 보임 | 운영 장애 | 마이그레이션 직후 quickstart.md 시나리오 1 즉시 실행 |
| `service_role` 사용 누락된 곳이 안 보임 | 권한 우회 | grep `SUPABASE_SERVICE_KEY` 로 잔존 확인 |
| 서버 컴포넌트에서 `cookies()` 가 read-only 라 세션 갱신 못함 | 토큰 만료 시 401 | middleware.ts 가 이미 갱신 담당, RSC 는 read 만 |
| `auth.users` 에 chanhee13p@gmail.com 이 없는 환경에서 마이그레이션 실행 | 트랜잭션 롤백 | RAISE EXCEPTION 으로 보호. 데이터 변경 없음. |

## Out of Scope

- 멤버 초대/수락 UX (#112 후속)
- 멀티 trip 전환 UI (#112)
- 공유 토큰 / 익명 접근 (#110)
- 권한 변경 UI / 역할 승격
