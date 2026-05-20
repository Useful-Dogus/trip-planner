# Trip Planner

여행 리서치와 일정 관리를 하나의 인터페이스에서 처리하는 멀티유저 플래너 웹앱. 후보 장소 조사부터 확정 일정, 동행자와의 공동 편집까지 한 화면에서 다룬다.

## 주요 기능

- **통합 항목 관리** — 리서치(후보) 및 일정(확정) 아이템을 하나의 테이블로 관리
- **지도 시각화** — Leaflet 기반 지도에 핀 표시 및 카테고리별 색상 구분
- **카테고리 / 우선순위 / 예약 상태 배지** — 이모지와 색상으로 한눈에 파악
- **일정 뷰** — 날짜별 그룹, 시간순 정렬, 시작/종료 시간 표시
- **Google Maps 가져오기** — 저장된 장소 목록을 앱에 일괄 임포트
- **멀티유저 / 트립 멤버십** — 여행별로 멤버를 초대해 공동 편집 (Supabase RLS + `trip_members`)
- **이메일 인증** — 회원가입 / 로그인 / 비밀번호 재설정 (Supabase Auth, 이메일 enumeration 방지)
- **모바일 최적화 UX** — 모바일 패널·필터·내비게이션 (맥북과 아이폰 브라우저 모두 동작)
- **빠른 응답을 위한 SWR 캐싱** — 클라이언트 캐시 + 사용자 전환 시 자동 invalidate

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| UI | React 18, Tailwind CSS 3 |
| 지도 | Leaflet, react-leaflet |
| 데이터베이스 | Supabase (PostgreSQL + RLS) |
| 인증 | Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`) |
| 데이터 패칭 | SWR |
| 검색 | fuse.js |

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

### 3. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열어 아래 값을 채운다 (환경 변수 섹션 참고).

### 4. Supabase 사전 설정

Supabase 대시보드에서 다음을 활성화한다.

- **Authentication → Providers → Email** 활성화
- **Authentication → URL Configuration** 의 Site URL / Redirect URLs 에 `http://localhost:3000` 및 운영 도메인 등록
- `supabase/` 디렉터리의 스키마 / 마이그레이션을 프로젝트에 반영 (RLS 정책 포함)

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

## 환경 변수

| 변수명 | 설명 | 값 취득 방법 |
|--------|------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL (서버/클라이언트 공용) | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key (클라이언트/SSR Auth 용) | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_KEY` | service role key (서버 전용, 비밀) | Supabase Dashboard → Project Settings → API |

## 스크립트

```bash
npm run dev      # 개발 서버 실행 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 실행
npm run lint     # 린트 실행
```

## 디자인 가이드

신규 화면·컴포넌트를 디자인하거나 기존 UI 를 수정할 때는 [docs/design-guidelines.md](docs/design-guidelines.md) 를 먼저 참고한다.
