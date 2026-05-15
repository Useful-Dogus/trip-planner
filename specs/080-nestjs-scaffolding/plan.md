# Implementation Plan: NestJS 백엔드 스캐폴딩 + Supabase 통합

**Branch**: `080-nestjs-scaffolding` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/080-nestjs-scaffolding/spec.md`

## Summary

trip-planner 를 npm workspaces 기반 모노레포로 재구성한다. 현재 Next.js 단일 프로젝트의 모든 코드를 `apps/web/` 으로 이동시키고, `apps/api/` 에 신규 NestJS 앱을 수동 셋업한다. NestJS 는 zod 로 환경변수를 검증하는 ConfigModule, `OnModuleInit` 에서 createClient 를 1 회 수행하는 글로벌 `SupabaseService`, `@nestjs/terminus` 기반 `GET /health` 엔드포인트(items 테이블 head-only count 핑) 까지 포함한다. 두 앱 모두 multi-stage Dockerfile 을 제공하고, 루트 `docker-compose.yml` 로 함께 실행할 수 있다. 이번 PR 의 범위는 인프라 스캐폴딩에 한정되며, 기존 Next.js API Routes 의 비즈니스 로직은 옮기지 않는다.

## Technical Context

**Language/Version**: TypeScript 5.x (양쪽 앱 공통), Node.js 20 LTS
**Primary Dependencies (apps/api 신규)**: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/config`, `@nestjs/terminus`, `@supabase/supabase-js`, `zod`, `class-validator`, `class-transformer`, `reflect-metadata`, `rxjs`
**Primary Dependencies (apps/web 유지)**: `next@14`, `react@18`, `@supabase/supabase-js`, `jose`, `fuse.js`, `leaflet`, `react-leaflet`, `swr`, `tailwindcss`, `lucide-react`, `uuid`
**Storage**: Supabase (PostgreSQL, 클라우드). 스키마 변경 없음. `supabase/schema.sql` 그대로 유지.
**Testing**: 이번 PR 범위에서는 단위 테스트 추가하지 않음. apps/api 에 `jest`, `supertest` 인프라만 셋업해 후속 이슈가 바로 사용할 수 있게 함.
**Target Platform**: Linux server (Docker), Vercel (apps/web), Node.js 20+
**Project Type**: Monorepo (web frontend + backend API)
**Performance Goals**: `/health` p95 < 500ms, dev 서버 부팅 < 30s
**Constraints**: 단일 lockfile 유지, Vercel 빌드 호환, JWT_SECRET 환경변수 키 보존
**Scale/Scope**: 워크스페이스 2개, 약 200줄 신규 NestJS 코드, 기존 Next.js 코드 약 15,000줄 디렉토리 이동

## Constitution Check

trip-planner 에는 별도 `.specify/memory/constitution.md` 가 없다. 일반 원칙 기준으로 점검:

- **Surface area 최소화**: Pass — Next.js 비즈니스 로직은 옮기지 않음. 디렉토리 이동만으로 회귀 가능성을 봉쇄.
- **단일 책임 PR**: Pass — 이번 PR 은 "스캐폴딩"만 담당. 후속 이슈들이 점진적으로 마이그레이션.
- **검증 가능성**: Pass — 헬스 엔드포인트 + 빌드 + dev 서버로 명확히 검증.
- **롤백 가능성**: Pass — 디렉토리 이동은 git 으로 추적 가능, NestJS 추가는 새 디렉토리이므로 격리.

## Project Structure

### Documentation (this feature)

```text
specs/080-nestjs-scaffolding/
├── spec.md
├── plan.md              # 이 파일
├── tasks.md             # speckit.tasks 출력
└── checklists/
    └── requirements.md  # spec quality 체크리스트
```

### Source Code (repository root, 이번 PR 종료 후)

```text
trip-planner/
├── apps/
│   ├── api/                              # 신규 NestJS 앱
│   │   ├── src/
│   │   │   ├── main.ts                   # bootstrap, ValidationPipe, CORS, shutdown hooks
│   │   │   ├── app.module.ts             # ConfigModule + SupabaseModule(@Global) + HealthModule
│   │   │   ├── config/
│   │   │   │   ├── env.schema.ts         # zod 스키마
│   │   │   │   └── config.module.ts      # ConfigModule.forRoot({ isGlobal, validate })
│   │   │   ├── supabase/
│   │   │   │   ├── supabase.module.ts    # @Global, exports SupabaseService
│   │   │   │   ├── supabase.service.ts   # OnModuleInit에서 createClient
│   │   │   │   └── supabase.health.ts    # HealthIndicator (items head-only count)
│   │   │   └── health/
│   │   │       ├── health.module.ts      # TerminusModule import
│   │   │       └── health.controller.ts  # GET /health
│   │   ├── test/
│   │   │   └── jest-e2e.json             # e2e 설정 (실제 테스트는 후속 이슈)
│   │   ├── Dockerfile                    # multi-stage
│   │   ├── .dockerignore
│   │   ├── .eslintrc.cjs                 # base extends + @typescript-eslint
│   │   ├── tsconfig.json                 # base extends, commonjs/decorators
│   │   ├── tsconfig.build.json           # build용 (test 제외)
│   │   ├── nest-cli.json
│   │   └── package.json                  # @trip-planner/api
│   └── web/                              # 기존 Next.js 이동
│       ├── app/                          # ← 루트 app/ 이동
│       ├── components/                   # ← 루트 components/ 이동
│       ├── lib/                          # ← 루트 lib/ 이동
│       ├── types/                        # ← 루트 types/ 이동
│       ├── public/                       # ← 루트 public/ 이동
│       ├── middleware.ts                 # ← 루트 middleware.ts 이동
│       ├── next.config.mjs               # ← 루트 next.config.mjs 이동
│       ├── tailwind.config.ts            # ← 루트 tailwind.config.ts 이동
│       ├── postcss.config.mjs            # ← 루트 postcss.config.mjs 이동
│       ├── next-env.d.ts                 # ← 루트 next-env.d.ts 이동
│       ├── tsconfig.json                 # ← 루트 tsconfig.json 이동 (base extends 로 변경)
│       ├── .eslintrc.json                # ← 루트 .eslintrc.json 이동 (base extends 로 변경)
│       ├── Dockerfile                    # multi-stage (Next standalone output 사용)
│       ├── .dockerignore
│       └── package.json                  # 이름: trip-planner-web
├── supabase/                             # 그대로 (스키마 공유)
│   └── schema.sql
├── docs/                                 # 그대로
├── specs/                                # 그대로
├── docker-compose.yml                    # 신규: api + web 서비스
├── tsconfig.base.json                    # 신규: 공유 base
├── .eslintrc.base.cjs                    # 신규: 공유 base
├── .prettierrc                           # 그대로 (공유)
├── .env.example                          # 수정: API_PORT, WEB_ORIGIN 추가
├── .env.local                            # (로컬, 그대로)
├── package.json                          # 워크스페이스 루트, 루트 scripts
├── package-lock.json                     # 단일
└── README.md                             # 수정: 모노레포 워크플로우 안내
```

**Structure Decision**: Web application 구조 (frontend + backend) 를 모노레포 패턴으로 채택. `apps/web` 은 기존 Next.js 디렉토리 그대로 이동, `apps/api` 는 신규 NestJS 표준 레이아웃.

## Phase 0: Research & Decisions

### Decision 1 — 모노레포 도구

**선택**: npm workspaces (turborepo 미도입)

- **근거**: 현재 `package-lock.json` 사용 중이라 패키지 매니저 전환 비용 0. 워크스페이스 2개에서 turborepo 캐싱 이점 < 도입 복잡도. 워크스페이스가 5개 이상으로 늘어나는 시점(여러 packages/* 공유 라이브러리 도입 등)에 turborepo 재검토.

### Decision 2 — NestJS 셋업 방식

**선택**: 수동 셋업 (nest CLI 미사용)

- **근거**: `nest new` 는 자체 `package.json`/`tsconfig`/`eslint`/`jest` 를 생성하는데, 우리는 워크스페이스 공유 설정을 쓰므로 결국 모두 덮어쓰게 된다. 의존성을 `apps/api/package.json` 에 명시적으로 선언하는 게 깔끔.

### Decision 3 — 환경변수 검증

**선택**: zod 스키마 + `ConfigModule.forRoot({ validate })`

- **근거**: 프로젝트가 TypeScript 타입 중심이고, zod 는 이미 React 생태계에서 친숙. Joi 는 NestJS 외부에서 거의 안 쓰는 라이브러리라 학습 비용 추가.

### Decision 4 — 헬스체크 구현

**선택**: `@nestjs/terminus` + 커스텀 `SupabaseHealthIndicator`

- **근거**: 표준 라이브러리 사용. 응답 포맷이 Kubernetes/모니터링 도구 호환. 향후 #107 에서 DB 핑 외 다른 health indicator(Redis, MailQueue 등) 추가 시 동일 패턴으로 확장.
- **DB 핑 방식**: `client.from('items').select('id', { count: 'exact', head: true })`. head-only 라 데이터를 fetch 하지 않고 connectivity 만 확인. service role key 사용으로 RLS 우회.

### Decision 5 — 포트 분리

**선택**: web 3000, api 3001

- **근거**: 3000 은 Next 기본. 4000 은 Apollo Server 기본이라 #104 GraphQL 추가 시 충돌 가능성. 3001 이 가장 명확.

### Decision 6 — Docker 전략

**선택**: apps/api/Dockerfile + apps/web/Dockerfile + 루트 docker-compose.yml

- **apps/api/Dockerfile**: builder 스테이지 (`npm ci` → `npm run build -w @trip-planner/api`) → runner 스테이지 (`node:20-alpine`, non-root, `dist/` + production deps 만 복사, `CMD ["node", "dist/main.js"]`).
- **apps/web/Dockerfile**: Next standalone output 사용 (`next.config.mjs` 에 `output: 'standalone'` 추가). builder 스테이지에서 `npm run build -w trip-planner-web` → runner 스테이지에서 `.next/standalone` + `.next/static` + `public/` 복사.
- **docker-compose.yml**: 빌드 context = 루트, dockerfile path = 각 앱. env_file = 루트 `.env.local`. healthcheck = api: `curl /health`, web: `curl /`. depends_on: web → api.

### Decision 7 — Vercel 호환

**선택**: 루트는 그대로 두고 Vercel 프로젝트 설정에서 Root Directory 를 `apps/web` 으로 변경

- **이 PR 의 책임**: `apps/web/package.json` 이 자체적으로 `next build` 가능하도록 보장. Vercel 콘솔에서 Root Directory 변경은 머지 후 수동 작업으로 진행 (별도 PR/문서화).

## Phase 1: Design Details

### 1.1 — 루트 `package.json` 변경

```json
{
  "name": "trip-planner",
  "version": "0.1.0",
  "private": true,
  "workspaces": ["apps/*"],
  "scripts": {
    "dev": "concurrently -n web,api -c blue,magenta \"npm run dev:web\" \"npm run dev:api\"",
    "dev:web": "npm run dev -w trip-planner-web",
    "dev:api": "npm run start:dev -w @trip-planner/api",
    "build": "npm run build -w trip-planner-web && npm run build -w @trip-planner/api",
    "build:web": "npm run build -w trip-planner-web",
    "build:api": "npm run build -w @trip-planner/api",
    "lint": "npm run lint --workspaces --if-present",
    "typecheck": "npm run typecheck --workspaces --if-present"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "prettier": "^3.3.3",
    "typescript": "^5.5.0"
  }
}
```

- 루트 이름 `trip-planner` 유지 (히스토리/외부 참조 보존).
- 의존성은 모두 워크스페이스로 이동. 루트엔 `concurrently`, `prettier`, `typescript` 만 (공유 도구).

### 1.2 — `tsconfig.base.json`

공통 옵션만:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

- `apps/web/tsconfig.json`: extends base + Next 옵션 (`jsx: preserve`, `plugins: next`, `paths: {"@/*": ["./*"]}`, `noEmit: true`, `incremental: true`).
- `apps/api/tsconfig.json`: extends base + Nest 옵션 (`module: commonjs`, `moduleResolution: node`, `experimentalDecorators: true`, `emitDecoratorMetadata: true`, `outDir: ./dist`, `noEmit: false`, `lib: ["ES2022"]`).

### 1.3 — `.eslintrc.base.cjs`

공통 룰만:

```cjs
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  ignorePatterns: ['dist', '.next', 'node_modules'],
};
```

- `apps/web/.eslintrc.json`: extends `['../../.eslintrc.base.cjs', 'next/core-web-vitals']`.
- `apps/api/.eslintrc.cjs`: extends `['../../.eslintrc.base.cjs']` + NestJS 권장 룰.

### 1.4 — `apps/api/src/config/env.schema.ts`

```ts
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(16),
});

export type Env = z.infer<typeof envSchema>;

export const validateEnv = (raw: Record<string, unknown>): Env => {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
};
```

### 1.5 — `apps/api/src/supabase/supabase.service.ts`

```ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import type { Env } from '../config/env.schema';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private _client!: SupabaseClient;

  constructor(private readonly config: ConfigService<Env, true>) {}

  onModuleInit(): void {
    const url = this.config.get('SUPABASE_URL', { infer: true });
    const key = this.config.get('SUPABASE_SERVICE_KEY', { infer: true });
    this._client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    this.logger.log('Supabase client initialized');
  }

  get client(): SupabaseClient {
    return this._client;
  }
}
```

### 1.6 — `apps/api/src/supabase/supabase.health.ts`

```ts
import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { SupabaseService } from './supabase.service';

@Injectable()
export class SupabaseHealthIndicator extends HealthIndicator {
  constructor(private readonly supabase: SupabaseService) {
    super();
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    const { error } = await this.supabase.client
      .from('items')
      .select('id', { count: 'exact', head: true });

    if (error) {
      throw new HealthCheckError(
        'Supabase ping failed',
        this.getStatus(key, false, { message: error.message }),
      );
    }
    return this.getStatus(key, true);
  }
}
```

### 1.7 — `apps/api/src/health/health.controller.ts`

```ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { SupabaseHealthIndicator } from '../supabase/supabase.health';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly supabase: SupabaseHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.supabase.pingCheck('supabase')]);
  }
}
```

### 1.8 — `apps/api/src/main.ts`

```ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import type { Env } from './config/env.schema';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Env, true>);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: config.get('WEB_ORIGIN', { infer: true }),
    credentials: true,
  });
  app.enableShutdownHooks();

  const port = config.get('API_PORT', { infer: true });
  await app.listen(port);
  new Logger('Bootstrap').log(`API listening on port ${port}`);
}
bootstrap();
```

### 1.9 — `apps/api/Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY tsconfig.base.json ./
COPY apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/nest-cli.json ./apps/api/
RUN npm ci --include-workspace-root --workspace=@trip-planner/api
COPY apps/api/src ./apps/api/src
RUN npm run build -w @trip-planner/api

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /repo/package.json /repo/package-lock.json ./
COPY --from=builder /repo/apps/api/package.json ./apps/api/
RUN npm ci --omit=dev --include-workspace-root --workspace=@trip-planner/api && npm cache clean --force
COPY --from=builder /repo/apps/api/dist ./apps/api/dist
USER app
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
```

### 1.10 — `apps/web/Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY tsconfig.base.json ./
RUN npm ci --include-workspace-root --workspace=trip-planner-web
COPY apps/web ./apps/web
RUN npm run build -w trip-planner-web

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /repo/apps/web/public ./apps/web/public
USER app
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

- 전제: `apps/web/next.config.mjs` 에 `output: 'standalone'` 추가.

### 1.11 — 루트 `docker-compose.yml`

```yaml
services:
  api:
    build:
      context: .
      dockerfile: ./apps/api/Dockerfile
    ports:
      - "3001:3001"
    env_file: .env.local
    environment:
      WEB_ORIGIN: http://localhost:3000
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  web:
    build:
      context: .
      dockerfile: ./apps/web/Dockerfile
    ports:
      - "3000:3000"
    env_file: .env.local
    depends_on:
      api:
        condition: service_healthy
    restart: unless-stopped
```

## Risks & Mitigations

| 위험 | 영향 | 대응 |
|------|------|------|
| Vercel 빌드 깨짐 (루트가 workspaces 루트로 전환) | 프로덕션 배포 실패 | PR 본문에 "Vercel 콘솔에서 Root Directory 를 `apps/web` 으로 변경 필요" 명시. `apps/web` 단독 빌드가 깨끗하게 작동하는지 PR 머지 전 로컬 검증. |
| Next.js paths(`@/*`) 깨짐 | 임포트 에러 | `apps/web/tsconfig.json` 에 paths 그대로 유지(`"@/*": ["./*"]`). 모든 임포트 경로는 디렉토리 이동 시 변하지 않음 (`@/components/...` 그대로). |
| middleware.ts 보호 라우트 회귀 | 인증 우회/오작동 | 이동 후 매뉴얼 회귀 테스트 (Story 1 의 Acceptance #3). `/login` → `/list` → `/api/items` 흐름 통과 확인. |
| 루트 `.env.local` 공유 — apps/web 은 Next 가 자동 로드, apps/api 는 envFilePath 명시 필요 | apps/api 환경변수 누락 | `ConfigModule.forRoot({ envFilePath: ['../../.env.local'] })`. Docker 컨테이너 내부에선 compose 의 env_file 로 주입되므로 envFilePath 무시되어도 동작. |
| 단일 lockfile 깨짐 | 의존성 해석 실패/충돌 | lockfile 갱신은 1-2 커밋에 묶어 진행. workspaces 전환 + apps/web 이동 + apps/api 신규 의존성을 단계별로 검증 (각 단계마다 `npm install` 후 `npm run build`). |
| Next standalone output 호환성 | 컨테이너 빌드 실패 | `output: 'standalone'` 은 Next 12+ 안정 기능. 다만 `react-leaflet`/`leaflet` 같은 client-only 패키지가 전체 트레이싱에 영향을 줄 수 있으므로 standalone 빌드 한 번 검증. |
| Supabase 헬스 핑이 RLS 에 막힘 | health 가 항상 down | service role key 사용 → RLS 우회 보장. 만약 fallback 필요 시 `auth.getSession()` 핑으로 교체. |
| 브랜치 이름이 `080-nestjs-scaffolding` (speckit 컨벤션) — /ship.next 는 `issue/103-...` 권장 | 브랜치 컨벤션 일관성 문제 | PR 본문에서 `Closes #103` 으로 명시. specs/ 디렉토리 일관성을 우선시한 결정. |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| 신규 dependency 12 개 (NestJS 코어 + terminus + zod + class-validator 등) | NestJS 표준 부팅 + 헬스체크 + 환경변수 검증을 위한 최소 셋. | 더 줄이면 헬스체크 자체 구현·env 검증 직접 작성이 필요해 후속 이슈에서 다시 도입해야 함. |
| Dockerfile 2 개 + docker-compose | 이슈 본문이 명시한 요구사항이며 사용자가 "API + Web 둘 다 컨테이너화" 선택. | "API 만 컨테이너화" 옵션 거절됨. Next 컨테이너는 후속 #105 에서 Vite 로 교체될 가능성 인지. |
