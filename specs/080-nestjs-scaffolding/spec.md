# Feature Specification: NestJS 백엔드 스캐폴딩 + Supabase 통합

**Feature Branch**: `080-nestjs-scaffolding`
**Created**: 2026-05-15
**Status**: Draft
**Input**: GitHub 이슈 #103 — Next.js API Routes에 흩어진 백엔드 책임을 NestJS 서버로 분리하기 위한 인프라 스캐폴딩

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 백엔드/프론트엔드 분리된 모노레포 구조 도입 (Priority: P1)

trip-planner 의 코드 베이스를 단일 Next.js 프로젝트에서 `apps/web` (현재 Next.js) 와 `apps/api` (신규 NestJS) 두 워크스페이스를 가진 모노레포로 재구성한다. 워크스페이스 루트는 공통 설정(TypeScript, ESLint, Prettier)을 공유하고, 각 앱은 독립적으로 빌드·실행 가능하다.

**Why this priority**: 후속 이슈 #104(GraphQL), #105(Vite 마이그레이션), #107(Auth) 등 마일스톤 1 의 모든 작업이 이 구조 위에서 진행된다. 토대가 먼저 서야 한다.

**Independent Test**: 루트에서 `npm install`, `npm run build`, `npm run dev:web`, `npm run dev:api` 가 각각 성공하고, 두 앱이 독립 포트(web 3000, api 3001)에서 동시에 실행된다.

**Acceptance Scenarios**:

1. **Given** 깨끗한 체크아웃 상태, **When** 루트에서 `npm install` 실행, **Then** apps/web 과 apps/api 의 의존성이 워크스페이스로 설치되고 단일 lockfile 이 갱신된다.
2. **Given** 설치 완료 상태, **When** `npm run dev` 실행, **Then** Next.js (3000) 와 NestJS (3001) 가 함께 실행되며 로그가 구분되어 출력된다.
3. **Given** 기존 사용자가 main 브랜치에서 사용하던 화면들 (`/login`, `/list`, `/map`, `/schedule`, `/items`), **When** 모노레포 전환 후 동일 경로 접속, **Then** 모든 화면이 회귀 없이 동일하게 동작한다.

---

### User Story 2 - NestJS API 서버 부팅 + Supabase 연결 검증 (Priority: P1)

apps/api 가 NestJS 기반으로 부팅되고, Supabase 클라이언트를 DI 가능한 서비스로 노출하며, 첫 헬스체크 엔드포인트로 DB 연결을 검증한다. 환경변수는 ConfigModule 로 일괄 관리하고 시작 시점에 검증한다.

**Why this priority**: 향후 모든 백엔드 비즈니스 로직(Auth, GraphQL, 데이터 액세스)의 진입점. Supabase 연결과 환경변수 검증이 startup 시점에 끝나야 후속 모듈이 안전하게 의존할 수 있다.

**Independent Test**: `curl http://localhost:3001/health` 가 200 응답을 돌려주고, 응답 본문에서 Supabase 연결 상태가 `up` 으로 표시된다. 잘못된 환경변수로 부팅하면 부팅 즉시 실패한다.

**Acceptance Scenarios**:

1. **Given** 올바른 `SUPABASE_URL` 과 `SUPABASE_SERVICE_KEY` 가 설정된 상태, **When** apps/api 부팅, **Then** Supabase 클라이언트가 초기화되고 헬스 엔드포인트가 `{ status: 'ok', info: { supabase: { status: 'up' } } }` 형태로 응답한다.
2. **Given** 필수 환경변수 중 하나가 누락된 상태, **When** apps/api 부팅 시도, **Then** zod 검증이 실패하며 누락된 키 이름이 명확히 로그에 출력되고 프로세스가 종료된다.
3. **Given** Supabase 가 일시적으로 도달 불가한 상태, **When** `/health` 호출, **Then** 503 상태와 함께 `supabase` 인디케이터가 `down` 으로 표시된다.

---

### User Story 3 - 컨테이너 기반 로컬 실행 (Priority: P2)

apps/api 와 apps/web 둘 다 컨테이너 이미지로 빌드 가능하고, 루트의 `docker-compose.yml` 한 번으로 두 서비스를 함께 띄울 수 있다. Supabase 는 클라우드를 사용하므로 compose 에는 포함하지 않는다.

**Why this priority**: CI/CD 와 후속 이슈에서 Apollo Server·Mail Queue 같은 백엔드 서비스가 추가될 때 일관된 실행 환경을 보장한다. P1 스토리가 동작한 후에 검증해도 무방하므로 P2.

**Independent Test**: 루트에서 `docker compose build` 가 두 이미지를 모두 생성하고, `docker compose up` 후 호스트에서 `localhost:3000` 과 `localhost:3001/health` 가 모두 응답한다.

**Acceptance Scenarios**:

1. **Given** Docker 데몬이 실행 중이고 `.env.local` 에 필수 환경변수가 설정된 상태, **When** `docker compose up --build`, **Then** api 와 web 컨테이너가 모두 healthy 상태로 진입한다.
2. **Given** 컨테이너 실행 중인 상태, **When** `docker compose down`, **Then** 두 컨테이너가 깨끗하게 종료되고 잔여 리소스가 남지 않는다.

---

### Edge Cases

- **루트 `.env.local` 공유**: apps/api 와 apps/web 이 동일 환경변수 파일을 읽어야 한다. NestJS ConfigModule 의 `envFilePath` 와 Next.js 의 기본 env 로딩 양쪽이 루트 `.env.local` 을 참조한다.
- **Vercel 배포 호환**: 루트가 npm workspaces 루트로 바뀌어도 Vercel 빌드가 깨지지 않아야 한다 (루트 디렉토리는 그대로 유지하되 빌드 커맨드는 `apps/web` 을 가리키도록).
- **tsconfig paths 충돌**: 기존 Next.js 의 `@/*` paths 가 apps/web 으로 이동 후에도 동일하게 작동해야 한다.
- **middleware 회귀**: `middleware.ts` 가 apps/web 으로 이동된 뒤에도 보호 라우트 (`/list`, `/api/items`, `/api/geocode`, `/api/gmaps/*`) 의 JWT 검증이 정상 동작한다.
- **JWT 시크릿 공유**: 향후 #107 에서 NestJS AuthModule 이 동일한 `JWT_SECRET` 으로 토큰을 서명·검증하도록, 이번 PR 에서 환경변수 키 이름을 변경하지 않는다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 시스템 MUST 루트 `package.json` 을 npm workspaces 루트로 전환하고, `apps/web` 과 `apps/api` 두 워크스페이스를 인식한다.
- **FR-002**: 시스템 MUST 현재 Next.js 코드 일체(`app/`, `components/`, `lib/`, `types/`, `middleware.ts`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `tsconfig.json`(Next 전용 부분), `.eslintrc.json`(Next 전용 부분), `public/`)를 `apps/web/` 하위로 이동한다.
- **FR-003**: 개발자 MUST `npm run dev:web` 으로 Next.js 단독 실행, `npm run dev:api` 로 NestJS 단독 실행, `npm run dev` 로 둘을 동시에 실행할 수 있다.
- **FR-004**: 시스템 MUST 루트에 `tsconfig.base.json` 과 `.eslintrc.base.cjs` 를 두고, 두 앱이 이를 extends 하여 공통 옵션을 상속받는다.
- **FR-005**: apps/api MUST NestJS 표준 구조(`src/main.ts`, `src/app.module.ts`, 모듈별 디렉토리)로 부팅한다.
- **FR-006**: apps/api MUST `@nestjs/config` 와 zod 스키마를 사용해 startup 시점에 환경변수(`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `API_PORT`, `WEB_ORIGIN`)를 검증한다. 필수 키 누락 시 부팅 실패.
- **FR-007**: apps/api MUST `SupabaseService` 를 `@Global()` 모듈로 노출하여, `OnModuleInit` 에서 `createClient` 를 1 회 수행하고 이후 다른 모듈에서 DI 로 주입받을 수 있게 한다.
- **FR-008**: apps/api MUST `@nestjs/terminus` 기반 `GET /health` 엔드포인트를 제공한다. 응답에는 Supabase connectivity 가 포함되며, 검증 방식은 `items` 테이블에 대한 head-only count 쿼리이다.
- **FR-009**: apps/api MUST `ValidationPipe` 글로벌 적용, `enableCors({ origin: WEB_ORIGIN, credentials: true })`, `enableShutdownHooks()` 를 main.ts 에서 설정한다.
- **FR-010**: 시스템 MUST `apps/api/Dockerfile` 과 `apps/web/Dockerfile` 을 multi-stage 빌드 형태로 제공한다. (builder + runner 스테이지, non-root 사용자, production-only 의존성 복사)
- **FR-011**: 시스템 MUST 루트 `docker-compose.yml` 에 `api` 와 `web` 두 서비스를 정의하고, 둘 다 루트 `.env.local` 을 env_file 로 로드한다.
- **FR-012**: 기존 보호 라우트 (`/login`, `/list`, `/map`, `/schedule`, `/items`, `/gmaps-import`) 와 API (`/api/auth/*`, `/api/items*`, `/api/geocode`, `/api/gmaps/*`) MUST 마이그레이션 후에도 동일하게 동작한다 (이번 PR 에서 백엔드 책임은 옮기지 않음).
- **FR-013**: 시스템 MUST 단일 `package-lock.json` 만 유지한다 (워크스페이스별 lockfile 생성 금지).
- **FR-014**: apps/api MUST 포트 3001(기본값, 환경변수로 override 가능)에서 listen 하고, apps/web 은 포트 3000 을 유지한다.

### Key Entities

- **워크스페이스 루트 (`/`)**: npm workspaces 매니페스트, 공유 tsconfig/ESLint/Prettier, docker-compose, 단일 lockfile, 루트 npm scripts.
- **apps/web**: 기존 Next.js 14 App Router 코드 일체. 자체 `package.json`, Next 전용 tsconfig (base extends), 자체 `.eslintrc.json` (base + `next/core-web-vitals`).
- **apps/api**: 신규 NestJS 앱. `src/main.ts` 진입점, ConfigModule (zod 검증), 글로벌 SupabaseModule (`SupabaseService`), HealthModule (`SupabaseHealthIndicator` + `HealthController`).
- **공유 환경변수**: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `AUTH_ID`, `AUTH_PASSWORD`, `API_PORT`, `WEB_ORIGIN`. 모두 루트 `.env.local` 에서 관리.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 깨끗한 체크아웃에서 `npm install && npm run build` 가 10 분 이내에 성공한다 (Next 빌드 + Nest 빌드 모두).
- **SC-002**: `npm run dev` 실행 30 초 이내에 두 앱이 모두 ready 상태로 진입하고, `localhost:3000` 과 `localhost:3001/health` 가 응답한다.
- **SC-003**: `/health` 엔드포인트가 정상 Supabase 연결 상태에서 평균 500ms 이하로 200 응답을 반환한다.
- **SC-004**: 기존 사용자가 사용하던 보호 라우트 6개 (`/login`, `/list`, `/map`, `/schedule`, `/items`, `/gmaps-import`) 가 모노레포 전환 후에도 100% 회귀 없이 동작한다.
- **SC-005**: `docker compose build` 가 두 이미지를 빌드하고, `docker compose up` 후 60 초 이내에 두 서비스가 모두 healthy 상태로 진입한다.
- **SC-006**: 후속 이슈 #104 (Apollo Server) 작업자가 추가 인프라 변경 없이 apps/api 에 새 모듈을 추가하고 `SupabaseService` 를 inject 받아 사용할 수 있다.

## Assumptions

- Supabase 는 클라우드 인스턴스를 사용한다 (compose 에 DB 컨테이너 포함하지 않음).
- 이번 PR 에서 기존 Next.js API Routes 의 백엔드 로직은 NestJS 로 옮기지 않는다 (스캐폴딩만). 마이그레이션은 #107 이후 이슈에서 처리.
- 패키지 매니저는 npm 을 유지한다 (pnpm/yarn 전환은 별도 결정).
- 모노레포 도구는 npm workspaces 만 사용한다 (turborepo 는 워크스페이스가 더 늘어나는 시점에 재검토).
- Vercel 배포 설정 변경은 별도 PR/콘솔 작업으로 수행한다 (이 PR 은 로컬 빌드 호환만 보장).

## Dependencies

- **선행**: 없음. 마일스톤 1 의 첫 작업.
- **후속**:
  - #104 — Apollo Server + GraphQL 스키마 (apps/api 에 GraphQL 모듈 추가)
  - #105 — Next.js → Vite + React (apps/web 내부 재구성)
  - #107 — NestJS AuthModule (이번 PR 의 `JWT_SECRET` 환경변수와 SupabaseService 재사용)
