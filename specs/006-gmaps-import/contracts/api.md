# API Contracts: 구글맵 장소 가져오기

**Branch**: `006-gmaps-import` | **Date**: 2026-04-06

---

## POST /api/gmaps/preview

구글맵 공개 리스트 URL에서 장소 목록을 가져와 기존 DB와 비교한 결과를 반환한다.

### Request

```
POST /api/gmaps/preview
Content-Type: application/json
Cookie: auth=<jwt>
```

```json
{
  "url": "https://maps.app.goo.gl/AbCdEf123"
}
```

### Response — 성공 (200)

```json
{
  "candidates": [
    {
      "place": {
        "name": "스타벅스 강남점",
        "address": "서울 강남구 강남대로 390",
        "lat": 37.4979,
        "lng": 127.0276,
        "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
        "googleCategory": "cafe"
      },
      "status": "new",
      "similarItem": null,
      "selected": true,
      "mappedCategory": "카페"
    },
    {
      "place": {
        "name": "교보문고 강남점",
        "address": "서울 강남구 강남대로 465",
        "lat": 37.5012,
        "lng": 127.0244,
        "googlePlaceId": "ChIJABC123",
        "googleCategory": "book_store"
      },
      "status": "similar",
      "similarItem": {
        "id": "item-uuid-123",
        "name": "교보문고"
      },
      "selected": false,
      "mappedCategory": "쇼핑"
    },
    {
      "place": {
        "name": "경복궁",
        "address": "서울 종로구 사직로 161",
        "lat": 37.5796,
        "lng": 126.9770,
        "googlePlaceId": "ChIJXYZ789",
        "googleCategory": "tourist_attraction"
      },
      "status": "duplicate",
      "similarItem": null,
      "selected": false,
      "mappedCategory": "관광"
    }
  ]
}
```

### Response — 오류 (400 / 403 / 500)

```json
{
  "error": "INVALID_URL",
  "message": "올바른 구글맵 리스트 URL을 입력해주세요."
}
```

| error 코드 | HTTP | 설명 |
|-----------|------|------|
| `INVALID_URL` | 400 | URL 형식 불일치 또는 리스트 URL이 아님 |
| `PRIVATE_LIST` | 403 | 비공개 리스트 |
| `PARSE_ERROR` | 500 | 구글맵 응답 파싱 실패 |
| `NETWORK_ERROR` | 500 | 구글맵 fetch 실패 |
| `EMPTY_LIST` | 200 | 장소 0개 (candidates: []) |

---

## POST /api/gmaps/import

검토 화면에서 선택된 장소를 DB에 INSERT한다.

### Request

```
POST /api/gmaps/import
Content-Type: application/json
Cookie: auth=<jwt>
```

```json
{
  "places": [
    {
      "name": "스타벅스 강남점",
      "address": "서울 강남구 강남대로 390",
      "lat": 37.4979,
      "lng": 127.0276,
      "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
      "googleCategory": "cafe"
    }
  ],
  "categoryOverrides": {
    "ChIJN1t_tDeuEmsRUsoyG83frY4": "카페"
  }
}
```

> `categoryOverrides`: 검토 화면에서 사용자가 카테고리를 변경한 경우 (선택적)

### Response — 성공 (201)

```json
{
  "inserted": 3
}
```

### Response — 오류

```json
{
  "error": "INSERT_FAILED",
  "message": "일부 장소를 저장하는 중 오류가 발생했습니다."
}
```
