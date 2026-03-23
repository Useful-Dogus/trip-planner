# API Contracts: NYC Trip Planner MVP

**Branch**: `001-trip-planner-mvp` | **Phase**: 1

모든 API 엔드포인트는 인증 쿠키(`auth`) 필요. 미인증 시 `401` 반환.

---

## 인증

### POST /api/auth/login

로그인. 성공 시 `auth` httpOnly 쿠키 설정.

**Request**
```json
{ "id": "string", "password": "string" }
```

**Response**
```json
// 200 OK
{ "ok": true }

// 401 Unauthorized
{ "error": "자격증명이 올바르지 않습니다." }
```

---

### POST /api/auth/logout

로그아웃. `auth` 쿠키 만료 처리.

**Response**
```json
// 200 OK
{ "ok": true }
```

---

## 항목 (Items)

### GET /api/items

전체 항목 목록 반환.

**Response**
```json
// 200 OK
{ "items": [ ...TripItem[] ] }
```

---

### POST /api/items

새 항목 생성. `id`, `created_at`, `updated_at`은 서버가 생성.

**Request**
```json
{
  "name": "string",          // 필수
  "category": "식당",        // 필수
  "status": "검토중",        // 필수
  "priority": "반드시",      // 선택
  "address": "string",       // 선택
  "lat": 40.748817,          // 선택
  "lng": -73.985428,         // 선택
  "links": [],               // 선택, 기본 []
  "budget": 50,              // 선택
  "memo": "string",          // 선택
  "date": "2025-06-01",      // 선택
  "time_start": "14:30"      // 선택
}
```

**Response**
```json
// 201 Created
{ "item": TripItem }

// 400 Bad Request
{ "error": "name은 필수입니다." }
```

---

### GET /api/items/[id]

단일 항목 조회.

**Response**
```json
// 200 OK
{ "item": TripItem }

// 404 Not Found
{ "error": "항목을 찾을 수 없습니다." }
```

---

### PUT /api/items/[id]

항목 수정. 전달한 필드만 업데이트 (partial update). `updated_at` 서버 갱신.

**Request**: POST /api/items 와 동일 구조 (부분 전달 가능)

**Response**
```json
// 200 OK
{ "item": TripItem }

// 404 Not Found
{ "error": "항목을 찾을 수 없습니다." }

// 400 Bad Request
{ "error": "유효성 오류 메시지" }
```

---

### DELETE /api/items/[id]

항목 삭제.

**Response**
```json
// 200 OK
{ "ok": true }

// 404 Not Found
{ "error": "항목을 찾을 수 없습니다." }
```

---

## 지오코딩

### GET /api/geocode?q={주소}

주소 문자열을 위도/경도로 변환. Nominatim 프록시.

**Query Parameters**
- `q` (필수): 주소 문자열 (예: `20 W 34th St, New York`)

**Response**
```json
// 200 OK — 변환 성공
{ "lat": 40.748817, "lng": -73.985428 }

// 200 OK — 주소 인식 불가
{ "lat": null, "lng": null }

// 400 Bad Request
{ "error": "q 파라미터가 필요합니다." }

// 500
{ "error": "지오코딩 서비스 오류" }
```

**참고**: 클라이언트는 `null` 응답을 정상으로 처리하고 좌표 없이 저장.
