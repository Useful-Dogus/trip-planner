# Trip Planner

개인 여행을 위한 리서치·일정 통합 플래너 웹앱. 후보 장소 조사부터 확정 일정 관리까지 하나의 인터페이스에서 처리한다.

## 주요 기능

- **통합 항목 관리** — 리서치(후보) 및 일정(확정) 아이템을 하나의 테이블로 관리
- **지도 시각화** — Leaflet 기반 지도에 핀 표시 및 카테고리별 색상 구분
- **카테고리 / 우선순위 / 예약 상태 배지** — 이모지와 색상으로 한눈에 파악
- **일정 뷰** — 날짜별 그룹, 시간순 정렬, 시작/종료 시간 표시
- **Google Maps 가져오기** — 저장된 장소 목록을 앱에 일괄 임포트
- **모바일 지원** — 맥북과 아이폰 브라우저 모두 동작

## 모노레포 구조

```
trip-planner/
├── apps/
│   ├── web/   # Next.js 14 (App Router) — 기존 프론트엔드 + API routes
│   └── api/   # NestJS — 백엔드 (스캐폴딩 단계, 후속 이슈에서 점진 마이그레이션)
├── supabase/  # DB 스키마
├── docs/      # 디자인 가이드 등
├── specs/     # 기능 사양
├── tsconfig.base.json   # 공유 TypeScript base
├── .eslintrc.base.cjs   # 공유 ESLint base
├── docker-compose.yml   # 로컬 컨테이너 실행
└── package.json         # npm workspaces 루트
```

이번 단계에서 NestJS 백엔드는 헬스체크/Supabase 연결 검증만 담당한다. 기존 Next.js API Routes(인증, items CRUD, geocode, gmaps)는 그대로 동작하며, 후속 이슈에서 점진적으로 NestJS 로 이전한다.

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프론트엔드 (apps/web) | Next.js 14, React 18, Tailwind CSS 3 |
| 백엔드 (apps/api) | NestJS 10, @nestjs/config + zod, @nestjs/terminus |
| 지도 | Leaflet, react-leaflet |
| 데이터베이스 | Supabase (PostgreSQL) |
| 데이터 패칭 (web) | SWR |
| 검색 | fuse.js |
| 인증 | JWT (jose) |
| 모노레포 | npm workspaces |

## 로컬 실행 방법

### 1. 저장소 클론

```bash
git clone <repository-url>
cd trip-planner
```

### 2. 의존성 설치

```bash
npm install
```

워크스페이스 루트에서 한 번만 실행하면 `apps/web` 과 `apps/api` 의존성이 모두 설치된다.

### 3. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열어 값을 채운다 (아래 환경 변수 섹션 참고). `apps/web` 과 `apps/api` 모두 루트 `.env.local` 을 공유한다.

### 4. 개발 서버 실행

```bash
# 둘 다 동시에
npm run dev

# 각각 실행
npm run dev:web   # Next.js  → http://localhost:3000
npm run dev:api   # NestJS   → http://localhost:3001
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.
API 상태 확인: [http://localhost:3001/health](http://localhost:3001/health).

### Docker 로 실행 (선택)

```bash
docker compose build
docker compose up -d
```

api 가 healthy 상태가 되면 web 이 함께 기동된다. 종료는 `docker compose down`.

## 환경 변수

| 변수명 | 설명 | 값 취득 방법 |
|--------|------|-------------|
| `AUTH_ID` | 로그인 아이디 | 직접 설정 (임의 문자열) |
| `AUTH_PASSWORD` | 로그인 비밀번호 | 직접 설정 (임의 문자열) |
| `JWT_SECRET` | JWT 서명 키 (최소 16자) | 직접 생성 (충분히 긴 랜덤 문자열) |
| `SUPABASE_URL` | Supabase 프로젝트 URL | [Supabase 대시보드](https://supabase.com) → Project Settings → API |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | [Supabase 대시보드](https://supabase.com) → Project Settings → API |
| `API_PORT` | NestJS API 포트 (기본 3001) | 직접 설정 |
| `WEB_ORIGIN` | CORS 허용 origin (기본 `http://localhost:3000`) | 직접 설정 |

## 스크립트

```bash
# 전체 (워크스페이스)
npm run dev       # web + api 동시 실행
npm run build     # web + api 빌드
npm run lint      # 모든 워크스페이스 린트
npm run typecheck # 모든 워크스페이스 타입체크

# Web (apps/web)
npm run dev:web
npm run build:web
npm run start:web

# API (apps/api)
npm run dev:api
npm run build:api
npm run start:api  # 프로덕션 모드 (dist 실행)
```

## Vercel 배포

루트가 모노레포 워크스페이스 루트로 전환되었으므로, Vercel 프로젝트 설정에서 **Root Directory** 를 `apps/web` 으로 변경해야 한다. (이번 변경 머지 후 1회만 수행)
