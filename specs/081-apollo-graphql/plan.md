# Implementation Plan: Apollo Server + GraphQL 스키마 (code-first) 셋업

**Branch**: `081-apollo-graphql` | **Date**: 2026-05-18 | **Spec**: [spec.md](./spec.md)
**Issue**: https://github.com/Useful-Dogus/trip-planner/issues/104

## Summary

`apps/api`(NestJS 10) 에 `@nestjs/graphql` + `@nestjs/apollo` 기반 GraphQL 게이트웨이를 도입한다. Trip / Day / Item / Lodging / Place 도메인 클래스에 `@ObjectType` / `@Field` 데코레이터로 스키마를 선언(code-first), `trip(id)` 단일 read-only Query 가 day / item / place / lodging 까지 한 응답으로 반환한다. DataLoader 로 N+1 방지 패턴을 깔아둔다. 기존 REST(`apps/web/app/api/**`) 는 deprecation 헤더만 추가하고 그대로 둔다.

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 18+
**Primary Dependencies (신규)**: `@nestjs/graphql` ^12, `@nestjs/apollo` ^12, `@apollo/server` ^4, `graphql` ^16, `dataloader` ^2
**기존 의존성 재활용**: `@nestjs/common`, `@supabase/supabase-js`, `SupabaseService`(이미 `@Global`)
**Storage**: Supabase (`items` 단일 테이블 — 현재 단일 사용자/단일 trip 모델). 추가 테이블 도입 없음.
**Testing**: Jest (기존). 본 이슈는 1) 모듈 부팅 1) 트레이싱 응답 메타 — 단위 테스트 위주.
**Target Platform**: Node 18+ 서버 (apps/api, 포트 3001).
**Project Type**: 모노레포 내 web-service.
**Performance Goals**: trip 1건(item 50개) 트리 페치에서 Supabase 호출 ≤ 10회.
**Constraints**: 기존 REST 회귀 금지. apps/web 변경 금지.
**Scale/Scope**: 내부 개발자 1-2명, 단일 trip 트리.

### 현행 데이터 모델 (확인 사항)

`supabase/schema.sql` 검사 결과 — 현재 DB 에는 `items` 한 테이블만 존재:

- `Trip` 은 암묵적 **싱글톤** (전체 `items` 컬렉션이 한 trip)
- `Day` 는 `items.date` 로 **groupBy 한 derived 엔티티**
- `Lodging` 은 `items.category === '숙박'` 으로 필터링되는 **derived 엔티티** (`apps/web/lib/lodging.ts` 가 클라이언트에서 수행 중)
- `Place` 는 외부(Google Places) 메타데이터. DB 캐시 없음. `items.google_place_id` 가 참조 키
  - 본 이슈에서는 **Place 를 items 자체 컬럼(name / address / lat / lng / google_place_id)에서 파생** 시킨다. 외부 Google Places API 호출은 도입하지 않는다 (#106 또는 별도 이슈에서 캐시 도입). DataLoader 패턴은 동일하게 적용 — `google_place_id` 키 단위로 한 번에 모아 처리하는 구조만 깐다.

다중 사용자 / 다중 trip 모델(#108) 도입 시 `trips` / `days` / `lodgings` 실제 테이블이 만들어진다. 그 시점에 GraphQL 스키마의 변경 없이(혹은 최소 변경) 백엔드 리졸버만 교체할 수 있도록 도메인 클래스를 미리 분리한다.

## Constitution Check

`.specify/memory/constitution.md` 는 템플릿 상태(미작성). 별도 게이트 없음. 프로젝트 규칙(`CLAUDE.md`):

- 디자인 가이드라인은 본 이슈에 해당 없음(UI 무관)
- `specs/` 의 완료된 스펙은 수정 금지 (해당 없음, 이 spec 은 신규)
- AI 서명 금지 → 커밋/PR 본문에 적용

게이트 통과.

## 모듈 구조 결정

```text
apps/api/src/
  graphql/                          # GraphQL 모듈 (전역 설정)
    graphql.module.ts               # GraphQLModule.forRoot, code-first 옵션, sandbox/tracing
    plugins/
      tracing.plugin.ts             # 응답에 extensions.tracing 노출
  trip/                             # trip 도메인
    trip.module.ts
    trip.resolver.ts                # Query trip(id: ID): Trip
    trip.service.ts                 # 싱글톤 trip 어댑터 (현재 trip = items 전체)
    models/
      trip.model.ts                 # @ObjectType class Trip
      day.model.ts                  # @ObjectType class Day (derived)
      item.model.ts                 # @ObjectType class Item
      lodging.model.ts              # @ObjectType class Lodging
      place.model.ts                # @ObjectType class Place
    loaders/
      items-by-trip.loader.ts       # tripId -> Item[] (per-request)
      place-by-id.loader.ts         # google_place_id -> Place
    trip.resolver.spec.ts           # 부팅/쿼리 스모크 테스트
  app.module.ts                     # GraphqlModule + TripModule 임포트 (기존 그대로 + 신규)
```

원칙: **도메인 클래스 1개 = 1 파일**, 리졸버는 도메인 단위로 분리. 향후 트레이드오프 발생 시 도메인 모듈을 잘게 쪼개기 쉽도록 한다.

## 핵심 설계 결정

### D1. GraphQL 옵션
- `driver: ApolloDriver`, `autoSchemaFile: join(process.cwd(), 'schema.gql')` — 빌드 시 파일로 저장 (git ignore)
- `sortSchema: true`
- `playground: false`, `plugins: [ApolloServerPluginLandingPageLocalDefault()]` → 개발 환경에서 Apollo Sandbox 자동 노출
- `path: '/graphql'`
- `introspection`: NODE_ENV !== 'production' 일 때 true
- `context: ({ req }) => ({ req, loaders: createLoaders(supabase) })` — 요청 단위 DataLoader 생성

### D2. DataLoader 라이프사이클
- 매 요청마다 `createLoaders(supabase)` 호출로 새 인스턴스 생성 (요청 간 캐시 누수 방지)
- 리졸버는 `@Context() ctx` 에서 loaders 를 꺼내 사용
- ItemsByDate / PlaceById 두 종류로 시작 (Day → Item / Item → Place)

### D3. `trip(id)` 시맨틱 (현행 단일-trip 모델)
- `id` 가 어떤 값이든 (혹은 sentinel "current") 현재 단일 trip 을 반환 → 단순한 적응 어댑터
- Trip 의 `days` 는 items 의 distinct date 를 정렬해 derive
- Trip 의 `lodgings` 는 `category === '숙박'` items 필터
- Day 의 `items` 는 비-숙박 + 해당 date 의 items
- Item 의 `place` 는 `google_place_id` 가 있으면 PlaceById 로 batch 조회 (현재는 item 컬럼 자체에서 만들어 반환)

### D4. 트레이싱
- Apollo 4 의 `ApolloServerPluginUsageReporting` 는 외부 키 필요 → 보류
- 대신 자체 `tracing.plugin.ts` 로 응답 `extensions.tracing` 에 리졸버별 ms 기록
- 로그에도 쿼리/총 ms 출력
- FR-006 / SC-005 충족

### D5. REST deprecation 마커
- `apps/web/app/api/**/route.ts` 핸들러 진입부에 응답 헤더 `Deprecation: true` 와 `Sunset` 미정(주석으로 안내)
- 코드 상단에 `// @deprecated #104 - 이 라우트는 /graphql 로 대체될 예정` JSDoc 주석 추가
- 동작 변경 0

### D6. 환경 변수 / config
- 추가 env 없음 (Supabase 그대로 사용)
- `apps/api` 의 health 엔드포인트와 공존: `GET /health` (기존), `POST /graphql` (신규)
- CORS: dev 에서는 apps/web (3000) 허용. main.ts 의 기존 CORS 설정 검토(있다면 그대로, 없으면 dev only `app.enableCors({ origin: true })`)

### D7. 테스트
- `trip.resolver.spec.ts` — Supabase 를 모킹하고 `trip(id)` 쿼리를 통합 실행해 days/items/lodgings 가 반환되는지, place 가 google_place_id 없을 때 null 인지 검증
- 부팅 스모크 테스트 (모듈 import 성공)
- N+1 검증은 수동 (스펙의 quickstart.md 에 절차 기재)

### D8. 클라이언트
- 변경 없음. apps/web 은 손대지 않음.

## Phase 0 — Research

`research.md` 에 다음 항목을 정리(중요한 것만):

1. NestJS 10 + Apollo Server 4 호환 패키지 버전 매트릭스
2. code-first 데코레이터 가이드라인 (`@ObjectType`, `@Field`, `@ID`, nullable, `() => [Day]`)
3. DataLoader per-request 패턴 (`@nestjs/graphql` 의 `context` factory)
4. Apollo Sandbox 활성화 방법 (Playground deprecation 이후)
5. 자체 tracing plugin 작성 패턴 (응답 `extensions` 에 데이터 주입)

## Phase 1 — Design Artifacts

### data-model.md
도메인 클래스별 필드 / nullable / 관계를 표로 정리.

### contracts/
GraphQL 은 단일 스키마가 곧 contract. `contracts/schema.graphql` 에 SDL 미리보기를 수기 작성(빌드 결과물의 기대치). 실제는 code-first 자동 생성이지만 PR 리뷰어가 형태를 빠르게 파악할 수 있도록.

### quickstart.md
1. `npm install` (workspace root)
2. `npm run dev:api` 로 apps/api 기동 (3001)
3. http://localhost:3001/graphql 에서 Apollo Sandbox 열어 다음 쿼리 실행
   ```graphql
   query { trip(id: "current") { id title days { date items { id name place { name lat lng } } } lodgings { id name date endDate } } }
   ```
4. 응답에 모든 중첩 필드가 채워져 있는지 확인
5. apps/api 콘솔에서 `tracing` 로그가 출력되는지 확인
6. `Deprecation: true` 헤더가 기존 `/api/items` 응답에 포함되는지 확인 (curl)

## Re-evaluate Constitution Check (post-design)

- 별도 헌법 미적용. 규칙 위반 없음.
- 추가 의존성 4개(`@nestjs/graphql`, `@nestjs/apollo`, `@apollo/server`, `graphql`, `dataloader`) — 표준 NestJS GraphQL 스택, 일반 관행, 정당화 OK.

## Risks / Mitigations

| 리스크 | 영향 | 완화 |
|---|---|---|
| schema.gql 빌드 결과물이 PR diff 노이즈 | 낮음 | `.gitignore` 에 추가 |
| 기존 REST 응답에 새 헤더 추가 → 클라이언트가 헤더 검사한다면 ? | 매우 낮음 | 헤더 추가만, 기존 동작 무변 |
| Place 메타데이터가 실제로는 외부 API 캐시 필요 | 중간 | 본 이슈는 items 컬럼만으로 derive. 캐시 도입은 #106 이후 별도 |
| `@nestjs/graphql` v12 와 Nest v10 호환 | 낮음 | 공식 매트릭스에서 v12 ↔ Nest 10 지원됨 |

## Out of Scope (재확인)

- Mutation
- 인증 / 권한
- apps/web 의 GraphQL 채택
- 기존 REST 제거
- 외부 Google Places API 실시간 호출
