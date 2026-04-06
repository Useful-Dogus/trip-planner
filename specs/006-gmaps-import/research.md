# Research: 구글맵 장소 가져오기

**Branch**: `006-gmaps-import` | **Date**: 2026-04-06

---

## 1. Google Maps Public List URL 구조 및 데이터 추출

### Decision
`maps.app.goo.gl` short URL을 HTTP redirect로 해석하여 전체 URL을 얻은 뒤, 구글맵 리스트 페이지 HTML을 fetch해 내장된 JSON 데이터를 파싱한다.

### Rationale
- `/maps/preview/entitylist/getlist` 내부 API는 비공식이며 파라미터 포맷이 공개되지 않아 안정적 사용이 불확실
- 구글맵 리스트 공개 페이지(`/maps/placelists/list/[listId]`)는 인증 없이 접근 가능
- 페이지 HTML에 `APP_INITIALIZATION_STATE` 등의 초기화 데이터가 내장되어 있으며, `)]}'\n` 접두사 제거 후 JSON 파싱 가능
- Vercel serverless `fetch()` 환경에서 동작

### URL 해석 흐름
```
maps.app.goo.gl/XXXX
  → HTTP 302 redirect (Firebase Dynamic Links)
  → google.com/maps/placelists/list/[listId]
```

listId 추출: URL에서 `/placelists/list/` 뒤의 segment 추출

### 비공개 리스트 감지
- HTTP 응답 상태 코드 403 또는 리다이렉트 대상 URL에 로그인 페이지 포함 시 비공개로 판단
- 페이지 파싱 결과에 장소 목록이 없을 경우 "비공개 또는 접근 불가" 처리

### Alternatives considered
- Playwright 사용: Vercel serverless 환경 제약으로 제외
- Google Takeout 파일 업로드: UX가 너무 복잡해 제외
- 공식 Places API: 저장된 리스트 조회 기능 미지원으로 제외

---

## 2. 장소 데이터 파싱

### Decision
구글맵 리스트 페이지 HTML에서 스크립트 태그 내 JSON 데이터를 정규식으로 추출하고, 장소별로 이름, 주소, 위도/경도, 구글 place_id를 파싱한다.

### Rationale
- `)]}'\n` 접두사: XSRF 방어용, 제거 후 JSON.parse 가능
- 응답 구조가 변경될 수 있으므로 파싱 실패 시 명확한 오류 메시지 반환
- lat/lng: 좌표 배열 형태로 내장

### Known Risk
비공식 데이터 구조이므로 구글 업데이트 시 파서가 깨질 수 있음. 이를 위해:
- 파싱 로직을 `services/gmaps/parser.ts`에 독립 모듈로 분리
- 파싱 실패 시 상세 오류 로깅

---

## 3. Fuzzy 이름 유사도 매칭

### Decision
**fuse.js** 라이브러리를 사용하며, 임계값(threshold)은 기본 0.35로 설정한다.

### Rationale
- 한국어 텍스트에서 문자 단위 fuzzy match가 동작함 (CJK 별도 설정 불필요)
- TypeScript 네이티브, zero native dependencies → Vercel 호환
- threshold 조정 가능 → 개발자가 false positive/negative 균형 조율 가능
- npm 다운로드 약 700만/주, 활발한 유지보수

### Configuration
```typescript
// fuse.js 설정
{
  keys: ['name'],
  threshold: 0.35,  // 0 = 완전 일치만, 1 = 모든 것 일치
  distance: 100,
  includeScore: true
}
```

### Alternatives considered
- `string-similarity` (Dice's Coefficient): 단순하지만 threshold 세밀 조정 어려움
- Levenshtein distance 직접 구현: 라이브러리 없이 가능하지만 한국어 합자 처리 시 복잡
- `hangul.js`: 자모 분리 기반 — 더 정확하나 과도한 의존성

---

## 4. 구글 카테고리 → 앱 카테고리 매핑

### Decision
구글맵 place types를 앱의 9개 카테고리로 매핑하는 룩업 테이블을 `services/gmaps/categoryMap.ts`에 정의한다.

### Mapping Table

| 앱 카테고리 | 구글 place types (대표) |
|------------|------------------------|
| 교통 | transit_station, bus_station, subway_station, train_station, airport, taxi_stand |
| 숙소 | hotel, lodging, motel, hostel, resort, campground |
| 식당 | restaurant, food, meal_takeaway, meal_delivery, bar |
| 카페 | cafe, bakery, coffee_shop |
| 관광 | tourist_attraction, museum, park, amusement_park, zoo, aquarium, art_gallery, landmark, natural_feature |
| 공연 | movie_theater, theater, concert_hall, night_club, performing_arts_theater |
| 스포츠 | stadium, gym, sports_complex, bowling_alley, golf_course, spa |
| 쇼핑 | shopping_mall, store, department_store, clothing_store, supermarket, convenience_store, pharmacy |
| 기타 | (위 매핑에 없는 모든 타입) |

### Rationale
구글 place types는 세분화(예: `korean_restaurant`)되어 있으므로 부모 타입 포함 계층 매핑 적용. 매핑 실패 시 "기타" 기본값.

---

## 5. DB 스키마 변경

### Decision
`items` 테이블에 `google_place_id TEXT` 컬럼을 nullable로 추가한다.

### Rationale
- 기존 데이터와의 하위 호환성 유지 (null 허용)
- 중복 감지 1차 기준으로 사용
- Supabase SQL Editor에서 단일 ALTER TABLE 명령으로 추가 가능

```sql
ALTER TABLE public.items ADD COLUMN google_place_id TEXT;
```

---

## 6. API 설계

### POST /api/gmaps/preview
- Input: `{ url: string }` (maps.app.goo.gl short URL)
- Output: `{ places: ImportCandidate[] }` 또는 `{ error: string }`
- 동작: URL 해석 → 장소 fetch → 기존 items와 비교 → 분류 결과 반환

### POST /api/gmaps/import
- Input: `{ places: GooglePlace[] }` (선택된 항목만)
- Output: `{ inserted: number }` 또는 `{ error: string }`
- 동작: 선택된 장소를 TripItem으로 변환 후 Supabase INSERT

---

## 7. Vercel 배포 제약

- Serverless function timeout: Hobby 10s, Pro 60s — 구글맵 fetch + 파싱은 통상 1-5초 내 완료
- 대용량 응답(50+ 장소): 메모리 제약 없음 (HTML 파싱은 수 MB 이내)
- `fetch()` 사용: Node.js 18+ 내장, 별도 설정 불필요
- bot detection 가능성: User-Agent 헤더 설정으로 완화

---

## Unresolved Risks

1. **파싱 안정성**: 구글맵 HTML 구조는 언제든 변경될 수 있음 — 파싱 실패 시 명확한 오류 메시지로 graceful degradation
2. **Bot detection**: 구글이 Vercel 서버리스 IP를 차단할 수 있음 — 초기에는 허용될 가능성이 높으나 장기적으로 불안정
3. **20개 제한**: 일부 역공학 구현에서 리스트당 20개 제한 존재 가능성 있음 — 실제 테스트로 검증 필요
