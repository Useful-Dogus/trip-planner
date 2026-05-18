# Vendor Exit Plan

trip-planner 는 Supabase + Vercel 위에 올라가 있다. 장기적으로는 두 벤더 모두에서 자유로워질 수 있는 옵션을 보존하되, **지금은 이전을 실행하지 않는다** — 트리거가 발생할 때까지 어댑터 이음새만 유지한다.

이 문서는 그 트리거와 절차를 미리 적어두는 곳이다. 실행은 트리거가 켜졌을 때만.

---

## 원칙

1. **벽 말고 이음새** — 벤더 호출은 `lib/*` 어댑터 안에서만 한다. 호출부는 어댑터의 함수 시그니처에만 의존.
2. **데이터는 항상 휴대 가능 상태로** — Postgres 표준 스키마 / RLS. 정기 백업.
3. **이전은 트리거가 켜졌을 때만** — 미리 짓지 않는다. 미리 지은 인프라는 매일 비용이 들고 진가는 안 드러난다.
4. **출구는 항상 적어둔다** — 트리거와 절차를 이 문서에 명시. 절차 자체가 자산.

---

## 어댑터 이음새 (현재 유지 항목)

| 어댑터 파일 | 벤더 호출을 감싸는 영역 |
|---|---|
| `lib/auth.ts` | Supabase Auth — 세션 검증, 로그인/로그아웃 |
| `lib/data.ts` | Supabase DB — `items` CRUD |
| `lib/geocode.ts` | Geocoding API (외부) |
| (추가 예정) `lib/share.ts` | `shares` 테이블 |
| (추가 예정) `lib/trip.ts` | `trips` / `trip_members` |

**규칙**: 페이지 / 컴포넌트 / API 라우트는 `@supabase/*` 를 직접 import 하지 않는다. 이 어댑터를 거친다.

---

## Supabase 이전

### 트리거 (아래 중 하나라도 충족)

- 월 비용 > $100 (현재 Free, 다음 Pro $25/mo)
- MAU > 10,000
- 필요한 기능이 RLS / Edge Functions 로 표현 안 됨
- Supabase 서비스 안정성 이슈 누적 (월 1회 이상 장애)
- 데이터 주권 / 리전 요구사항 발생

### 잠금 강도별 이전 비용

| 영역 | 잠금 | 이전 방법 |
|---|---|---|
| DB (Postgres) | **거의 0** | `pg_dump` → 다른 Postgres 호스트로 import. 1일 |
| RLS 정책 | **0** | 표준 SQL. 그대로 |
| Storage | 낮음 | S3 호환 클라이언트로 마이그레이션. 1일 |
| Auth (users + sessions) | **중간** | 1만명 이하면 며칠. `users` 테이블 export 후 새 Auth 시스템으로 import. 비밀번호 해시는 bcrypt 면 그대로, 아니면 next-login 시 강제 재설정 |
| Edge Functions | 낮음 | Deno → Node 재작성. 본 제품은 사용 안 함 |
| Realtime | 높음 | 본 제품은 사용 안 함 |

### 절차 (트리거 시)

1. **DB 이전**: 셀프호스트 Postgres (예: Neon / Render / 직접 호스팅) 준비. `pg_dump` → restore. 5-30분 다운타임 또는 read-only 모드.
2. **Auth 이전**: 후보 — Clerk / Auth.js / 자체 NestJS Auth. users 테이블 export, 새 시스템에서 import. 첫 로그인 시 세션 재발급. 비밀번호 재설정 메일 일괄 발송.
3. **Storage 이전**: S3 또는 Cloudflare R2 로 객체 복사. URL 패턴 변경.
4. **어댑터 갈아끼우기**: `lib/auth.ts`, `lib/data.ts` 내부 구현만 교체. 호출부 수정 0.
5. **DNS / 환경변수 전환**: 새 인프라로 가리키도록 변경.
6. **모니터링 1주**: 로그 / 에러율 / 응답 시간 비교.
7. **Supabase 프로젝트 일시 정지** (즉시 삭제 X) → 1주 후 백업 확인 → 삭제.

### 예상 작업 일수

- 단독 개발자 기준 **5-10 영업일** (트리거 시점에 사용자 규모에 따라)

---

## Vercel 이전

### 트리거 (아래 중 하나라도 충족)

- 월 비용 > $50
- 빌드 큐 대기가 일상화 (5분+)
- Edge runtime 제약이 기능 구현을 막음
- Vercel Korea 리전 이슈로 응답 시간 저하

### 잠금 강도

거의 없음. Next.js 는 오픈소스, 표준 Node 런타임에서 동작.

### 이전 후보

| 후보 | 장점 | 단점 |
|---|---|---|
| Cloudflare Pages | 무료 / 글로벌 CDN / Edge Functions | Next.js SSR 일부 호환성 |
| Netlify | Next.js 1급 지원 | Pro 가격 Vercel 과 유사 |
| 셀프호스트 (Docker + nginx) | 완전 통제 | 운영 부담 |
| AWS Amplify | AWS 통합 | 가격 / 학습 |

### 절차 (트리거 시)

1. 후보 1개 선정 후 staging 환경에서 빌드 확인
2. 환경변수 이전
3. 도메인 DNS 변경 (Vercel → 신규)
4. Vercel 프로젝트 일시 정지 → 1주 후 삭제

### 예상 작업 일수

- **1-2 영업일**

---

## 정기 백업 (트리거 전부터 유지)

| 항목 | 주기 | 방식 |
|---|---|---|
| Supabase DB | 주 1회 | `pg_dump` → 로컬 또는 S3 |
| Supabase Storage (사용 시) | 주 1회 | 객체 복사 |
| 코드 | 매 PR | GitHub (이미) |
| 환경변수 목록 | 변경 시 | 비밀 관리자 (1Password 등) |

> **TODO**: 자동 백업 cron / GitHub Actions workflow 도입은 별도 이슈로.

---

## 이 문서의 갱신

- 어댑터 추가/삭제 시 갱신
- 벤더 가격 정책 변경 시 트리거 임계값 재검토
- 실제 이전을 실행한 경우 — 이 문서를 `VENDOR_EXIT_LOG.md` 로 옮기고 새 벤더용 신규 작성

마지막 갱신: 2026-05-18 (마일스톤 1 재구성 시점)
