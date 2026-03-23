# Research: NYC Trip Planner MVP

**Branch**: `001-trip-planner-mvp` | **Phase**: 0

---

## 1. JSON 파일 쓰기 전략

**Decision**: Next.js **Server Actions** + `fs.promises` 원자적 쓰기 (write to `.tmp` → rename)

**Rationale**:
- Server Actions는 App Router의 mutation 패턴에 적합하며 캐시 무효화와 통합됨
- `fs.promises.rename()`은 POSIX 레벨에서 원자적(atomic) — 부분 쓰기로 인한 파일 손상 불가
- 2인 동시 사용 환경에서 "마지막 쓰기 승리(last-write-wins)"는 허용 범위 (스펙 명시)
- 별도 lock 라이브러리 불필요

```typescript
// 원자적 쓰기 패턴
const tmpPath = dataPath + '.tmp';
await fs.promises.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
await fs.promises.rename(tmpPath, dataPath);
```

**Alternatives considered**:
- API Routes: 가능하지만 Server Actions가 App Router와 더 자연스럽게 통합됨
- async-mutex / async-lock: 2인 규모에서 불필요한 복잡도
- SQLite: 로컬 앱에 과도한 복잡도

---

## 2. JWT 인증 (DB 없음)

**Decision**: `jose` 라이브러리 + httpOnly 쿠키 + `middleware.ts` 라우트 보호

**Rationale**:
- `jose`는 Edge Runtime 호환 (middleware에서 동작) — zero dependency
- httpOnly 쿠키는 XSS로부터 토큰 보호
- middleware.ts에서 중앙 집중식 인증 체크 → 모든 보호 경로에 자동 적용
- 하드코딩 계정은 환경변수(`AUTH_ID`, `AUTH_PASSWORD`)에서 읽음

**Key pattern**:
```typescript
// middleware.ts — Edge Runtime에서 동작
import { jwtVerify } from 'jose';
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', request.url));
  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

**Alternatives considered**:
- NextAuth.js: 단일 하드코딩 계정에 과도함, 번들 크기 증가
- 서버 사이드 세션: 불필요한 메모리 상태 관리
- localStorage 토큰: XSS 취약

---

## 3. Leaflet.js + Next.js App Router SSR 처리

**Decision**: `next/dynamic`으로 react-leaflet 컴포넌트를 `ssr: false` 로 로드

**Rationale**:
- Leaflet은 모듈 로드 시점에 `window`, `document`에 접근 → SSR에서 ReferenceError 발생
- `ssr: false`로 클라이언트 전용 렌더링으로 격리
- 지도 컴포넌트에 `'use client'` 선언 필수

```typescript
// 권장 패턴
const ResearchMap = dynamic(() => import('@/components/Map/ResearchMap'), {
  ssr: false,
  loading: () => <div className="h-full bg-gray-100 animate-pulse" />,
});
```

**Leaflet CSS 로드**: `app/layout.tsx`에서 전역 import
```typescript
import 'leaflet/dist/leaflet.css';
```

**기본 마커 아이콘 fix**: Next.js + Leaflet 조합에서 마커 이미지 경로 깨짐 → 컴포넌트 내에서 `Icon` 수동 설정 필요

**Alternatives considered**:
- 커스텀 Leaflet 직접 통합: 더 많은 제어 가능하나 유지보수 부담
- Mapbox iframe: 실시간 핀 업데이트 불가, 외부 서비스 의존

---

## 4. 주소 → 좌표 변환 (지오코딩)

**Decision**: **Nominatim** (OpenStreetMap) — 무료, API 키 불필요

**API 패턴**:
```
GET https://nominatim.openstreetmap.org/search
  ?q={주소}&format=json&limit=1&accept-language=en
Header: User-Agent: NYC-TripPlanner/1.0  ← ToS 필수
```

**NYC 주소 신뢰도**: 높음 — 뉴욕은 OSM 데이터 품질 우수
**Rate limit**: 1 req/sec (공유 IP). 2인 소규모 앱에서 안전.
**캐싱**: API Route에서 `next: { revalidate: 86400 }` (24h 캐시) 적용

**응답 예시**:
```json
[{ "lat": "40.7484", "lon": "-73.9967", "display_name": "Empire State..." }]
```

**실패 처리**: 좌표 변환 실패 시 `lat/lng`을 null로 저장. 해당 항목은 지도에서 제외 (스펙 Edge Case 처리).

**Alternatives considered**:
- Google Maps Geocoding API: API 키 + 비용 발생
- Mapbox Geocoding: 토큰 필요
- 로컬 오프라인 DB: 과도한 복잡도

---

## 5. 동시 쓰기 안전성

**Decision**: 원자적 rename만으로 충분. 별도 mutex 불필요.

| 시나리오 | 원자적 rename | mutex |
| -------- | ------------- | ----- |
| 2인 동시 쓰기 | 마지막 쓰기 승리 (OS 원자 보장) | 직렬화 |
| 파일 손상 | 불가 | 불가 |
| 복잡도 | `rename()` 1줄 | 라이브러리 추가 |

**결론**: 2인 사용 + "마지막 쓰기 승리" 허용 정책(스펙 명시) → 원자적 rename으로 충분.

---

## 기술 스택 최종 확정

| 항목 | 결정 |
| ---- | ---- |
| 언어 | TypeScript |
| 프레임워크 | Next.js 14+ (App Router) |
| 스타일 | Tailwind CSS |
| 지도 | react-leaflet + Leaflet.js + OpenStreetMap tiles |
| 인증 | jose (JWT) + httpOnly 쿠키 |
| 데이터 | JSON 파일 (`data/items.json`) + 원자적 fs 쓰기 |
| 지오코딩 | Nominatim (OpenStreetMap) |
| 런타임 | Node.js (로컬) + ngrok |
