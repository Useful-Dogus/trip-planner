# Data Model: NYC Trip Planner MVP

**Branch**: `001-trip-planner-mvp` | **Phase**: 1

---

## 저장 구조

모든 데이터는 단일 JSON 파일 `data/items.json`에 배열로 저장된다.

```json
{
  "items": [ ...TripItem[] ]
}
```

---

## 핵심 타입 정의

```typescript
// types/index.ts

export type Category = '교통' | '숙소' | '식당' | '관광' | '쇼핑' | '기타';
export type Status   = '검토중' | '보류' | '대기중' | '확정' | '탈락';
export type Priority = '반드시' | '들를만해' | '시간 남으면';

export interface Link {
  label: string;  // 표시 이름 (예: "공식 웹사이트", "구글 맵")
  url:   string;  // 유효한 URL
}

export interface TripItem {
  id:         string;     // UUID v4, 서버 생성
  name:       string;     // 필수. 장소/활동 이름
  category:   Category;   // 필수
  status:     Status;     // 필수. 기본값: '검토중'
  priority?:  Priority;   // 선택
  address?:   string;     // 선택. 자유 텍스트 주소
  lat?:       number;     // 선택. 소수점 6자리 (예: 40.748817)
  lng?:       number;     // 선택. 소수점 6자리 (예: -73.985428)
  links:      Link[];     // 기본값: []
  budget?:    number;     // 선택. USD 정수 (예: 50)
  memo?:      string;     // 선택. 자유 텍스트
  date?:      string;     // 선택. YYYY-MM-DD (예: "2025-06-01")
  time_start?: string;    // 선택. HH:MM 24시간 (예: "14:30")
  created_at: string;     // ISO 8601. 서버 생성
  updated_at: string;     // ISO 8601. 서버 갱신
}
```

---

## 유효성 규칙

| 필드 | 규칙 |
| ---- | ---- |
| `name` | 필수. 공백만 있는 경우 저장 거부 |
| `category` | 필수. 허용 값 외 저장 거부 |
| `status` | 필수. 허용 값 외 저장 거부 |
| `priority` | 선택. 허용 값 외 저장 거부 |
| `links[].url` | URL 형식 검증 (`https?://` 시작) |
| `date` | YYYY-MM-DD 형식 검증 |
| `time_start` | HH:MM 형식 검증 (00:00 ~ 23:59) |
| `budget` | 양의 정수. 음수 거부 |
| `lat` / `lng` | 숫자. lat: -90~90, lng: -180~180 |

---

## 상태 전이

```
검토중 ──→ 보류
검토중 ──→ 대기중
검토중 ──→ 확정   ← date + time_start 입력 권장
검토중 ──→ 탈락
보류   ──→ 검토중
보류   ──→ 탈락
대기중 ──→ 확정
대기중 ──→ 탈락
확정   ──→ 탈락
탈락   ──→ 검토중
```

**일정 뷰 표시 조건**: `status === '확정' && date !== undefined`

---

## 뷰별 필터링 규칙

### 리서치 지도
- `lat`과 `lng`이 모두 있고 `status !== '탈락'` 인 항목만 표시

### 일정 목록
- `status === '확정'` AND `date !== undefined` 인 항목
- 정렬: `date` 오름차순 → 같은 날짜는 `time_start` 오름차순 → `time_start` 없으면 그룹 마지막

### 일정 지도
- 선택된 날짜와 `date`가 일치하고, `lat`과 `lng`이 모두 있는 확정 항목
- 번호 순서: `time_start` 오름차순

---

## 카테고리별 지도 핀 색상

채도를 낮춰 지도 위에서 부드럽게 보이도록 300~400 레벨 사용.

| 카테고리 | 색상 | Tailwind |
| -------- | ---- | -------- |
| 교통 | 쿨그레이 `#94A3B8` | slate-400 |
| 숙소 | 하늘색 `#7DD3FC` | sky-300 |
| 식당 | 소프트오렌지 `#FB923C` | orange-400 |
| 관광 | 민트그린 `#6EE7B7` | emerald-300 |
| 쇼핑 | 라벤더 `#C4B5FD` | violet-300 |
| 기타 | 소프트옐로 `#FCD34D` | amber-300 |

## 상태·우선순위 배지 색상

배경 100 + 텍스트 700 조합으로 부드럽게.

| 상태/우선순위 | 배경 | 텍스트 |
| ------------ | ---- | ------ |
| 검토중 | blue-100 | blue-700 |
| 보류 | gray-100 | gray-600 |
| 대기중 | yellow-100 | yellow-700 |
| 확정 | emerald-100 | emerald-700 |
| 탈락 | red-100 | red-400 |
| 반드시 | rose-100 | rose-700 |
| 들를만해 | orange-100 | orange-700 |
| 시간 남으면 | gray-100 | gray-500 |

---

## 샘플 데이터 구조 (`data/items.json`)

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "엠파이어 스테이트 빌딩",
      "category": "관광",
      "status": "확정",
      "priority": "반드시",
      "address": "20 W 34th St, New York, NY 10001",
      "lat": 40.748817,
      "lng": -73.985428,
      "links": [
        { "label": "공식 사이트", "url": "https://www.esbnyc.com" }
      ],
      "budget": 44,
      "memo": "저녁 노을 시간대 추천. 사전 예약 필수.",
      "date": "2025-06-02",
      "time_start": "18:00",
      "created_at": "2025-03-23T00:00:00.000Z",
      "updated_at": "2025-03-23T00:00:00.000Z"
    }
  ]
}
```

---

## 데이터 파일 관리 원칙

- `data/items.json`은 Git 추적 대상 (코드와 함께 커밋)
- 개발자 직접 편집 시: 저장 후 앱 새로고침으로 즉시 반영
- 서버 쓰기 패턴: `data/items.json.tmp` 에 쓰고 `rename()` — 파일 손상 방지
- `.gitignore`에서 `data/items.json` 제외 (추적 대상 유지)
