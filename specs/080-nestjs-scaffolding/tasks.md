# Tasks: NestJS 백엔드 스캐폴딩 + Supabase 통합

**Feature**: 080-nestjs-scaffolding
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Execution Order

각 phase 내 task 는 순차 실행. Phase 간에는 이전 phase 의 체크포인트 통과 후 다음 phase 진행.

---

## Phase A — 워크스페이스 루트 전환 (Next.js 회귀 0 보장)

목표: 루트를 npm workspaces 루트로 전환하되, Next.js 빌드/실행은 그대로 작동.

- [ ] **A1**: 루트 `package.json` 백업용 메모 (현재 의존성 목록 기록).
- [ ] **A2**: 루트 `tsconfig.base.json` 신규 작성 (공통 옵션만).
- [ ] **A3**: 루트 `.eslintrc.base.cjs` 신규 작성 (공통 룰만).
- [ ] **A4**: `apps/web/` 디렉토리 생성 + 다음 파일/디렉토리를 `git mv` 로 이동:
  - `app/` → `apps/web/app/`
  - `components/` → `apps/web/components/`
  - `lib/` → `apps/web/lib/`
  - `types/` → `apps/web/types/`
  - `public/` → `apps/web/public/`
  - `middleware.ts` → `apps/web/middleware.ts`
  - `next.config.mjs` → `apps/web/next.config.mjs`
  - `tailwind.config.ts` → `apps/web/tailwind.config.ts`
  - `postcss.config.mjs` → `apps/web/postcss.config.mjs`
  - `next-env.d.ts` → `apps/web/next-env.d.ts`
  - 루트 `tsconfig.json` → `apps/web/tsconfig.json` (base extends 로 수정)
  - 루트 `.eslintrc.json` → `apps/web/.eslintrc.json` (base extends 로 수정)
- [ ] **A5**: `apps/web/package.json` 신규 작성 (이름 `trip-planner-web`, 기존 루트의 Next 관련 dependencies 모두 이동, scripts: dev/build/start/lint).
- [ ] **A6**: `apps/web/next.config.mjs` 에 `output: 'standalone'`, `outputFileTracingRoot` 추가 (모노레포 standalone 빌드 호환).
- [ ] **A7**: 루트 `package.json` 재작성 (`workspaces: ["apps/*"]`, name 유지, devDeps 만 `concurrently`/`prettier`/`typescript`, 루트 scripts 추가).
- [ ] **A8**: 루트 `.prettierrc` 그대로 두기 (자동 상속).
- [ ] **A9**: `npm install` 실행 → lockfile 갱신 확인.
- [ ] **A10**: 검증 — `npm run build:web` 성공.
- [ ] **A11**: 검증 — `npm run dev:web` 으로 `http://localhost:3000` 접속, `/login` 로그인 후 `/list` 정상 로드 확인.
- [ ] **A12**: 검증 — `npm run lint` 통과 (apps/web only).

**체크포인트 A**: Next.js 회귀 0. 모든 보호 라우트 정상.

---

## Phase B — apps/api NestJS 스캐폴딩

목표: 신규 NestJS 앱 부팅 + Supabase 헬스체크 통과.

- [ ] **B1**: `apps/api/` 디렉토리 + `apps/api/package.json` 작성 (`@trip-planner/api`, NestJS + terminus + zod + class-validator 의존성).
- [ ] **B2**: `apps/api/tsconfig.json` + `tsconfig.build.json` 작성 (base extends, commonjs/decorators).
- [ ] **B3**: `apps/api/nest-cli.json` 작성.
- [ ] **B4**: `apps/api/.eslintrc.cjs` 작성 (base extends).
- [ ] **B5**: `apps/api/src/config/env.schema.ts` 작성 (zod 스키마, validateEnv 함수).
- [ ] **B6**: `apps/api/src/config/config.module.ts` 작성 (ConfigModule.forRoot, envFilePath: `../../.env.local`).
- [ ] **B7**: `apps/api/src/supabase/supabase.service.ts` 작성 (Injectable, OnModuleInit, createClient).
- [ ] **B8**: `apps/api/src/supabase/supabase.health.ts` 작성 (HealthIndicator, items head-only ping).
- [ ] **B9**: `apps/api/src/supabase/supabase.module.ts` 작성 (@Global, exports SupabaseService + SupabaseHealthIndicator).
- [ ] **B10**: `apps/api/src/health/health.module.ts` 작성 (TerminusModule import).
- [ ] **B11**: `apps/api/src/health/health.controller.ts` 작성 (GET /health).
- [ ] **B12**: `apps/api/src/app.module.ts` 작성 (AppConfigModule + SupabaseModule + HealthModule).
- [ ] **B13**: `apps/api/src/main.ts` 작성 (reflect-metadata import, bootstrap, ValidationPipe, CORS, shutdown hooks).
- [ ] **B14**: `npm install` 재실행.
- [ ] **B15**: 검증 — `npm run build:api` 성공 (`apps/api/dist/` 생성).
- [ ] **B16**: 검증 — `npm run dev:api` 부팅 후 `curl http://localhost:3001/health` → 200, `info.supabase.status: 'up'`.
- [ ] **B17**: 검증 — `SUPABASE_URL` 을 잘못된 값으로 변경하고 부팅 → 명확한 zod 에러 메시지 출력 후 종료.

**체크포인트 B**: 헬스체크 통과. 두 앱 동시 실행 가능 (`npm run dev`).

---

## Phase C — Docker 구성

목표: 두 앱 모두 컨테이너 빌드/실행 가능.

- [ ] **C1**: `apps/api/Dockerfile` 작성 (multi-stage, non-root).
- [ ] **C2**: `apps/api/.dockerignore` 작성 (node_modules, dist, .env*).
- [ ] **C3**: `apps/web/Dockerfile` 작성 (multi-stage, Next standalone).
- [ ] **C4**: `apps/web/.dockerignore` 작성.
- [ ] **C5**: 루트 `docker-compose.yml` 작성 (api + web 서비스, healthcheck, env_file).
- [ ] **C6**: 루트 `.dockerignore` 작성 (.git, .next, node_modules, specs 등 빌드 무관 항목).
- [ ] **C7**: 검증 — `docker compose build` 두 이미지 빌드 성공.
- [ ] **C8**: 검증 — `docker compose up -d` 후 60초 이내 두 서비스 healthy. `curl localhost:3001/health` 200, `curl localhost:3000` 200.
- [ ] **C9**: 검증 — `docker compose down` 정상 종료.

**체크포인트 C**: 컨테이너 기반 실행 완료.

---

## Phase D — 문서화 + 마무리

- [ ] **D1**: 루트 `.env.example` 업데이트 (`API_PORT`, `WEB_ORIGIN` 추가).
- [ ] **D2**: 루트 `README.md` 업데이트:
  - 모노레포 구조 설명
  - `npm run dev` / `dev:web` / `dev:api` 사용법
  - `docker compose up` 사용법
  - 헬스체크 엔드포인트 안내
- [ ] **D3**: 루트 `CLAUDE.md` 의 Project Structure 섹션 업데이트 (`apps/web`, `apps/api` 반영).
- [ ] **D4**: 최종 `npm run lint`, `npm run build` 통과 확인.
- [ ] **D5**: `git status` 로 누락 파일 점검.

**체크포인트 D**: PR 생성 준비 완료.

---

## Phase E — PR 생성

- [ ] **E1**: 커밋 메시지 작성 (Conventional Commits, 한국어, `Co-Authored-By` 금지).
- [ ] **E2**: `git push -u origin 080-nestjs-scaffolding`.
- [ ] **E3**: PR 생성 (`gh pr create`), 본문에 `Closes #103` 포함, Vercel Root Directory 변경 안내 명시.

---

## 검증 매트릭스 (PR 머지 전)

| 검증 항목 | 명령/조건 | 통과 기준 |
|-----------|-----------|-----------|
| 의존성 설치 | `npm install` | 단일 lockfile, 에러 0 |
| 타입 체크 (전체) | `npm run typecheck` (워크스페이스 전체) | 에러 0 |
| 린트 | `npm run lint` | 에러 0 (warning 허용) |
| 빌드 | `npm run build` | `.next/` + `apps/api/dist/` 생성 |
| Web dev | `npm run dev:web` + 브라우저 회귀 | `/login → /list → /map → /schedule → /items → /gmaps-import` 정상 |
| API dev | `npm run dev:api` + `curl /health` | 200, supabase up |
| API failure mode | 잘못된 SUPABASE_URL 로 부팅 | zod 에러 후 즉시 종료 |
| Docker build | `docker compose build` | 두 이미지 빌드 성공 |
| Docker up | `docker compose up -d` → 60s 대기 | 두 서비스 healthy |
| Docker down | `docker compose down` | 컨테이너 정리됨 |
