# Data Model: 구글맵 장소 가져오기

**Branch**: `006-gmaps-import` | **Date**: 2026-04-06

---

## DB Schema 변경

### items 테이블 — 컬럼 추가

```sql
ALTER TABLE public.items ADD COLUMN google_place_id TEXT;
```

기존 데이터는 `null`로 유지. 이 컬럼은 구글맵에서 가져온 장소의 식별자 역할을 한다.

---

## 신규 TypeScript 타입

### GooglePlace
구글맵 리스트에서 파싱된 원본 장소 데이터.

```typescript
interface GooglePlace {
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  googlePlaceId: string | null;
  googleCategory: string | null;  // 구글 원본 place type
}
```

### ImportStatus
검토 화면에서 장소의 분류 상태.

```typescript
type ImportStatus =
  | 'new'       // DB에 없음 — 기본 선택
  | 'similar'   // 이름 유사도 높음 — 기본 선택 해제, 경고
  | 'duplicate' // google_place_id 완전 일치 — 선택 불가
```

### ImportCandidate
검토 화면의 각 행 데이터 단위.

```typescript
interface ImportCandidate {
  place: GooglePlace;
  status: ImportStatus;
  similarItem?: {
    id: string;
    name: string;
  };
  selected: boolean;
  mappedCategory: Category;  // 앱 9개 카테고리로 매핑된 값
}
```

---

## TripItem 타입 확장

기존 `TripItem`에 `google_place_id` 필드 추가:

```typescript
interface TripItem {
  // ... 기존 필드 ...
  google_place_id?: string | null;  // 신규 추가
}
```

---

## 상태 전이

```
URL 입력
  → [loading] URL 해석 중
    → [error] 잘못된 URL / 비공개 리스트 / 파싱 실패
    → [review] 장소 목록 표시 (ImportCandidate[])
      → [importing] 추가 중
        → [done] "N개 장소가 추가되었습니다"
        → [error] DB 저장 실패
```

---

## 장소 추가 시 기본값

구글맵에서 가져온 장소를 TripItem으로 변환할 때:

| 필드 | 기본값 |
|------|--------|
| `status` | `"검토중"` |
| `priority` | `null` |
| `links` | `[]` |
| `budget` | `null` |
| `memo` | `null` |
| `date` | `null` |
| `time_start` | `null` |
| `time_end` | `null` |
| `is_franchise` | `false` |
| `branches` | `null` |
