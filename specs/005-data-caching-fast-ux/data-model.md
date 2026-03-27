# Data Model: 데이터 캐싱 및 빠른 UX 전략

**Feature**: 005-data-caching-fast-ux
**Date**: 2026-03-27

---

## 기존 엔티티 (변경 없음)

### TripItem

기존 타입 정의(`types/index.ts`) 그대로 유지. 이 기능은 TripItem의 구조를 변경하지 않는다.

---

## 신규 개념 모델

### ItemsCache (캐시 레이어)

클라이언트 측 캐시 상태를 나타내는 개념 모델. 실제 구현은 SWR의 내부 캐시로 관리되며 localStorage에 영속화된다.

| 필드 | 타입 | 설명 |
|------|------|------|
| `items` | `TripItem[]` | 전체 아이템 목록 스냅샷 |
| `cachedAt` | `number` (timestamp) | 마지막으로 서버에서 성공적으로 수신한 시각 (ms) |
| `isExpired` | `boolean` (computed) | `cachedAt`으로부터 24시간 경과 여부 |

**TTL 규칙**: `cachedAt`로부터 86,400,000ms(24시간)가 지나면 만료. 만료된 캐시는 표시는 하되 백그라운드에서 즉시 갱신을 트리거한다.

**저장 키**: localStorage의 `trip-planner-cache` 키에 JSON 직렬화.

---

### OptimisticOperation (낙관적 연산)

서버 응답 전에 UI에 반영된 임시 변경 단위. 롤백 시 사용된다.

| 필드 | 타입 | 설명 |
|------|------|------|
| `type` | `'update' \| 'delete' \| 'create'` | 연산 종류 |
| `targetId` | `string` | 대상 아이템 ID (임시 ID 포함) |
| `snapshot` | `TripItem[]` | 연산 직전 전체 목록 스냅샷 (롤백용) |
| `payload` | `Partial<TripItem>` | 변경 내용 |

---

### SyncStatus (동기화 상태)

UI에서 현재 캐시의 상태를 표현하기 위한 열거형 개념.

| 값 | 의미 |
|----|------|
| `fresh` | 캐시가 최신 상태 (백그라운드 갱신 완료) |
| `stale` | 캐시가 오래됨 (갱신 중 또는 갱신 대기) |
| `offline` | 네트워크 없음 (캐시 데이터만 표시) |
| `error` | 갱신 실패 (캐시 표시, 재시도 가능) |

---

## 상태 전이 다이어그램

### 캐시 생명주기

```
[최초 접속] → 캐시 없음 → 서버 로드 → fresh
                                         ↓
                          포커스 복귀(30초+) → stale → 백그라운드 갱신 → fresh
                                                              ↓
                                                        갱신 실패 → error → 재시도 → fresh
                                                                              ↓
                                                              네트워크 없음 → offline → 재연결 → fresh
```

### 낙관적 업데이트 생명주기

```
[사용자 액션] → snapshot 저장 → UI 즉시 반영(임시)
                                       ↓
                          서버 요청 전송 (비동기)
                                 ↓                  ↓
                           성공 → SWR 재검증      실패 → snapshot으로 롤백
                                                          → 토스트 알림 (재시도 버튼)
```

---

## useItems 훅 인터페이스 계약

이 기능의 핵심 인터페이스. 모든 페이지/컴포넌트는 직접 `fetch`를 호출하는 대신 이 훅을 통해 데이터에 접근한다.

```typescript
interface UseItemsReturn {
  // 데이터
  items: TripItem[]
  isLoading: boolean       // 최초 로드 중 (캐시 없을 때만 true)
  isValidating: boolean    // 백그라운드 갱신 중
  syncStatus: SyncStatus
  error: Error | null

  // 쓰기 연산 (모두 낙관적 업데이트)
  createItem: (item: Omit<TripItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateItem: (id: string, changes: Partial<TripItem>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  updateStatus: (id: string, status: Status) => Promise<void>  // 빠른 상태 토글용
}
```

**설계 원칙**:
- `isLoading`은 캐시가 전혀 없을 때만 `true` → 이 경우에만 스켈레톤 표시
- `isValidating`은 백그라운드 갱신 중에도 `true` → UI는 그대로 유지하고 subtle indicator만 표시 가능
- 모든 쓰기 연산은 Promise를 반환하지만, 호출자는 응답을 기다리지 않고 즉시 계속 진행 가능
