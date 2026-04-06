# 009 — "이번 여행에서" 단일 컬럼으로 통합

## 배경

현재 아이템에는 `status` (아이디어/검토/확정/제외)와 `priority` (반드시/들를만해/시간 남으면) 두 개의 독립된 필드가 있다. 이 둘은 의미상 중복되며 UX상 혼란을 준다. 두 필드를 합쳐 **"이번 여행에서"** 라는 단일 컬럼으로 대체한다.

## 새 필드: `trip_priority`

| 값 | 의미 | 순서 |
|---|---|---|
| `검토 필요` | 아직 결정하지 않은 후보 | 0 |
| `시간 되면` | 여유가 있으면 가볼 곳 | 1 |
| `가고 싶음` | 꼭 가고 싶은 곳 | 2 |
| `확정` | 일정에 넣기로 결정 | 3 |
| `제외` | 이번 여행에서 제외 | 4 |

## 마이그레이션 규칙 (기존 데이터 → 새 값)

| 조건 | 새 값 |
|---|---|
| `status == '확정'` | `확정` |
| `status == '제외'` 또는 `'탈락'` | `제외` |
| `priority == '반드시'` 또는 `'들를만해'` | `가고 싶음` |
| `priority == '시간 남으면'` | `시간 되면` |
| `status == '아이디어'` 또는 `'검토'` (priority 없음) | `검토 필요` |
| 이미 새 값인 경우 | 그대로 pass-through |
| 그 외 (레거시 불명) | `검토 필요` |

## DB 전략

- **기존 `status` 컬럼을 재사용**한다. `trip_priority` 값을 `status` 컬럼에 저장.
- `priority` 컬럼은 deprecated. 마이그레이션 후 `null`로 저장.
- DB 스키마 변경 없음 (DDL 불필요).
- 앱이 데이터를 읽을 때 `normalizeTripItem`이 자동 마이그레이션 후 write-back.

## UI 변경

- ItemCard 메타데이터 칩: `StatusBadge` + `PriorityBadge` → `TripPriorityBadge` 1개
- ItemPanel 퀵 편집: `status` + `priority` 드롭다운 → `trip_priority` 드롭다운 1개
- ItemForm / PanelItemForm: 동일 통합
- ItemList 필터: `status` 필터 + `priority` 필터 → `trip_priority` 필터 1개
- "제외 항목 보기" 토글: `trip_priority === '제외'` 기준 유지
- 정렬: `trip_priority` 순서(order) 기준 정렬 유지

## 비기능 요건

- 기존 데이터셋을 자동 마이그레이션 (앱 로드 시 write-back)
- 이전 `Status`, `Priority` 타입 완전 제거
- `reservation_status` 필드는 유지
