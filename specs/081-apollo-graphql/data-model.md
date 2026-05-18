# Data Model — 081 Apollo GraphQL

## 도메인 클래스

### Trip
| 필드 | 타입 | nullable | 비고 |
|---|---|---|---|
| id | ID | N | 현재는 sentinel "current" |
| title | String | Y | 단일-trip 모델에선 기본 제목 |
| startDate | String | Y | items 의 최소 date |
| endDate | String | Y | items 의 최대 date |
| days | [Day!]! | N | items.date groupBy |
| lodgings | [Lodging!]! | N | category === '숙박' filter |

### Day (derived)
| 필드 | 타입 | nullable | 비고 |
|---|---|---|---|
| date | String! | N | YYYY-MM-DD |
| items | [Item!]! | N | 같은 date 의 non-lodging items |

### Item
| 필드 | 타입 | nullable | 비고 |
|---|---|---|---|
| id | ID! | N | items.id |
| name | String! | N | |
| category | String! | N | |
| date | String | Y | |
| timeStart | String | Y | |
| timeEnd | String | Y | |
| memo | String | Y | |
| budget | Int | Y | |
| address | String | Y | |
| lat | Float | Y | |
| lng | Float | Y | |
| googlePlaceId | String | Y | |
| place | Place | Y | googlePlaceId 가 있을 때만 |

### Lodging
| 필드 | 타입 | nullable | 비고 |
|---|---|---|---|
| id | ID! | N | items.id |
| name | String! | N | |
| date | String | Y | 체크인 |
| endDate | String | Y | 체크아웃 |
| address | String | Y | |
| lat | Float | Y | |
| lng | Float | Y | |
| memo | String | Y | |

### Place
| 필드 | 타입 | nullable | 비고 |
|---|---|---|---|
| id | ID! | N | google_place_id |
| name | String | Y | item.name 또는 향후 캐시 |
| address | String | Y | item.address |
| lat | Float | Y | item.lat |
| lng | Float | Y | item.lng |

## 관계

```text
Trip 1 ─── n Day (derived from items.date)
Trip 1 ─── n Lodging (derived from items where category='숙박')
Day  1 ─── n Item   (filter items by date && category != '숙박')
Item 0..1 ── 1 Place  (via google_place_id)
```

## DataLoader Keys

| Loader | Key | Returns |
|---|---|---|
| `itemsByTrip` | tripId(string) | Item[] (전체) |
| `placeById` | google_place_id(string) | Place |

- `itemsByTrip` 는 단일-trip 모델에서 사실상 한 번만 호출되지만, 다중-trip 도입(#108) 시 batch 가 의미 있어 미리 마련.
- `placeById` 는 trip 트리 페치 시 여러 item 의 place 를 한 번에 모아 해결 (현재는 in-memory derive, 향후 캐시/외부 API 로 교체 가능).
