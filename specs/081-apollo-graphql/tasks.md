# Tasks — 081 Apollo GraphQL

> 모든 경로는 `apps/api/src/...` 기준 (별도 표기 시 제외).

## P0. 의존성 추가
- [ ] T001: `apps/api/package.json` 에 `@nestjs/graphql`, `@nestjs/apollo`, `@apollo/server`, `graphql`, `dataloader` 추가
- [ ] T002: `npm install` (workspace root)
- [ ] T003: `.gitignore` 에 `apps/api/schema.gql` 추가

## P1. GraphQL 모듈 셋업
- [ ] T010: `graphql/graphql.module.ts` — `GraphQLModule.forRootAsync` (ApolloDriver, code-first, sandbox, tracing plugin, context factory)
- [ ] T011: `graphql/plugins/tracing.plugin.ts` — 자체 ApolloServerPlugin (리졸버별 ms 측정, extensions.tracing 주입, console.log)
- [ ] T012: `graphql/loaders.ts` — `createLoaders(supabase)` 팩토리, ItemsByTrip / PlaceById 로더

## P2. 도메인 모델 (code-first)
- [ ] T020: `trip/models/trip.model.ts` — @ObjectType Trip
- [ ] T021: `trip/models/day.model.ts` — @ObjectType Day
- [ ] T022: `trip/models/item.model.ts` — @ObjectType Item
- [ ] T023: `trip/models/lodging.model.ts` — @ObjectType Lodging
- [ ] T024: `trip/models/place.model.ts` — @ObjectType Place

## P3. 리졸버 + 서비스
- [ ] T030: `trip/trip.service.ts` — supabase 에서 items 읽기, Trip/Day/Lodging derive
- [ ] T031: `trip/trip.resolver.ts` — Query `trip(id)`
- [ ] T032: `trip/item.resolver.ts` (또는 trip.resolver 내) — Item.place 리졸버 (PlaceById loader 사용)
- [ ] T033: `trip/trip.module.ts` — providers, resolvers 등록

## P4. App 모듈 연결
- [ ] T040: `app.module.ts` 에 `GraphqlModule`, `TripModule` 추가
- [ ] T041: `main.ts` CORS 확인 (dev origin 허용)

## P5. REST deprecation
- [ ] T050: `apps/web/app/api/items/route.ts` 및 `[id]/route.ts`, `auth/*`, `gmaps/*`, `geocode/route.ts` 응답에 `Deprecation: true` 헤더 추가 + 상단 JSDoc 마커

## P6. 테스트 / 검증
- [ ] T060: `trip/trip.resolver.spec.ts` — 모듈 부팅 + `trip(id)` 쿼리 스모크 (Supabase 모킹)
- [ ] T061: 수동 quickstart 검증 (Sandbox 쿼리, tracing 로그 확인, REST 헤더 확인)

## P7. 빌드 게이트
- [ ] T070: `npm run lint` 통과
- [ ] T071: `npm run build` 통과 (apps/web + apps/api)
- [ ] T072: 모든 변경 커밋

## 의존 관계
P0 → P1 → P2 → P3 → P4. P5/P6 는 P4 이후 병행 가능. P7 마지막.
