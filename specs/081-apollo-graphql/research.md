# Research — 081 Apollo GraphQL

## R1. NestJS 10 + Apollo Server 4 패키지 매트릭스

- **결정**: `@nestjs/graphql@^12`, `@nestjs/apollo@^12`, `@apollo/server@^4`, `graphql@^16`
- **근거**: NestJS 10 공식 가이드(`docs.nestjs.com/graphql/quick-start`) 가 권장하는 조합. v12 는 Apollo Server 4 가 require peer.
- **대안**: Mercurius(Fastify) — 본 프로젝트는 Express(@nestjs/platform-express) 라 부적합.

## R2. Code-first 데코레이터 규칙

- **결정**: 도메인 클래스에 `@ObjectType()` + 필드별 `@Field(() => Type, { nullable?: true })`. ID 는 `@Field(() => ID)`. 리스트는 `@Field(() => [Day])`.
- **근거**: 단일 소스(클래스) → 스키마 자동 생성. SDL 수기 파일 불필요.
- **주의**: TypeScript 의 `reflect-metadata` 가 이미 설치되어 있음. `tsconfig` 의 `emitDecoratorMetadata: true`, `experimentalDecorators: true` 확인.

## R3. DataLoader per-request

- **결정**: `GraphQLModule.forRoot({ context: ({ req }) => ({ req, loaders: createLoaders(supabase) }) })`. 요청마다 새 인스턴스.
- **근거**: per-request 가 표준. 요청 종료 시 자동 폐기.
- **대안 (배제)**: 글로벌 싱글톤 — 캐시 누수 위험.

## R4. Apollo Sandbox 활성화

- **결정**: `playground: false`, 대신 `plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })]`.
- **근거**: Apollo Server 4 에서 Playground deprecated. Sandbox 가 후속.
- **개발 환경에서만**: `process.env.NODE_ENV !== 'production'`.

## R5. 자체 Tracing Plugin

- **결정**: `ApolloServerPlugin` 인터페이스를 구현해 `requestDidStart` → `willSendResponse` 사이의 `executionDidStart.willResolveField` 훅에서 리졸버별 ms 측정. 응답 `extensions.tracing` 에 주입.
- **근거**: 외부 Apollo Studio 키 없이도 로컬에서 즉시 가시화 가능. SC-005 충족.
- **대안 (배제)**: `apollo-server-plugin-response-cache` 와 묶인 USAGE_REPORTING — 외부 API 키 필수. 본 이슈 범위 밖.

## R6. REST deprecation 표식

- **결정**: 응답 헤더 `Deprecation: true` + 코드 상단 `// @deprecated #104` JSDoc 주석. 동작 변경 없음.
- **근거**: RFC 8594(Deprecation HTTP Header) 표준. 클라이언트가 옵션으로 감지 가능, 무시해도 무방.
- **대안 (배제)**: Sunset 헤더 — 정확한 제거 시점 미정이라 보류.
