# Trip Planner

개인 여행을 위한 리서치·일정 통합 플래너 웹앱. 후보 장소 조사부터 확정 일정 관리까지 하나의 인터페이스에서 처리한다.

## 주요 기능

- **통합 항목 관리** — 리서치(후보) 및 일정(확정) 아이템을 하나의 테이블로 관리
- **지도 시각화** — Leaflet 기반 지도에 핀 표시 및 카테고리별 색상 구분
- **카테고리 / 우선순위 / 예약 상태 배지** — 이모지와 색상으로 한눈에 파악
- **일정 뷰** — 날짜별 그룹, 시간순 정렬, 시작/종료 시간 표시
- **Google Maps 가져오기** — 저장된 장소 목록을 앱에 일괄 임포트
- **모바일 지원** — 맥북과 아이폰 브라우저 모두 동작

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| UI | React 18, Tailwind CSS 3 |
| 지도 | Leaflet, react-leaflet |
| 데이터베이스 | Supabase (PostgreSQL) |
| 데이터 패칭 | SWR |
| 검색 | fuse.js |
| 인증 | JWT (jose) |

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

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

## 환경 변수

| 변수명 | 설명 | 값 취득 방법 |
|--------|------|-------------|
| `AUTH_ID` | 로그인 아이디 | 직접 설정 (임의 문자열) |
| `AUTH_PASSWORD` | 로그인 비밀번호 | 직접 설정 (임의 문자열) |
| `JWT_SECRET` | JWT 서명 키 | 직접 생성 (충분히 긴 랜덤 문자열) |
| `SUPABASE_URL` | Supabase 프로젝트 URL | [Supabase 대시보드](https://supabase.com) → Project Settings → API |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | [Supabase 대시보드](https://supabase.com) → Project Settings → API |

## 스크립트

```bash
npm run dev      # 개발 서버 실행 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 실행
npm run lint     # 린트 실행
```
