# Research: README 및 프로젝트 문서 추가

## 프로젝트 파악

- **앱 성격**: 개인(2인) 뉴욕 여행 플래너 웹앱
- **주요 기능**: 리서치(후보 장소 조사) + 일정(확정 일정 관리)을 통합 항목 테이블로 관리. 지도 핀, 카테고리/우선순위/예약상태 배지.
- **접근 방식**: 로컬 맥북 + ngrok으로 아이폰 접속 허용

## 기술 스택 (package.json 기반)

- Next.js 14.2.0 (App Router)
- React 18.3.1
- Tailwind CSS 3.x
- Supabase (@supabase/supabase-js)
- react-leaflet + Leaflet.js (지도)
- SWR (데이터 캐싱)
- fuse.js (퍼지 검색)
- jose (JWT 인증)

## 환경 변수 (.env.example 기반)

| 변수명 | 설명 | 취득 방법 |
|--------|------|-----------|
| `AUTH_ID` | 로그인 아이디 | 직접 설정 |
| `AUTH_PASSWORD` | 로그인 비밀번호 | 직접 설정 |
| `JWT_SECRET` | JWT 서명 키 (충분히 긴 랜덤 문자열) | 직접 생성 |
| `SUPABASE_URL` | Supabase 프로젝트 URL | Supabase 대시보드 → Project Settings → API |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | Supabase 대시보드 → Project Settings → API |

## 실행 명령 (package.json scripts)

- `npm install` — 의존성 설치
- `npm run dev` — 개발 서버 (http://localhost:3000)
- `npm run build` — 프로덕션 빌드
- `npm run lint` — 린트

## 결론

추가 연구 불필요. README 작성에 필요한 모든 정보가 코드베이스에서 확인됨.
