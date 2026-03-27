# Implementation Plan: 데이터 캐싱 및 빠른 UX 전략

**Branch**: `005-data-caching-fast-ux` | **Date**: 2026-03-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-data-caching-fast-ux/spec.md`

---

## Summary

탭 전환 시 매번 발생하는 로딩 스켈레톤을 제거하고 아이템 수정·삭제·추가를 즉각 반영하기 위해 SWR 기반 캐싱 레이어를 도입한다. stale-while-revalidate 전략으로 캐시 즉시 표시 + 백그라운드 갱신을 구현하고, localStorage 영속화로 새로고침 후에도 즉시 표시를 보장한다. 모든 쓰기 연산은 낙관적 업데이트(즉시 반영 + 실패 시 롤백)로 처리하며, 상태 뱃지 드롭다운으로 패널 없이 빠른 상태 변경을 제공한다.

---

## Technical Context

**Language/Version**: TypeScript 5.x + Node.js 18+
**Primary Dependencies**: Next.js 14.2.0 (App Router), React 18.3.1, Tailwind CSS 3.x, SWR (신규 추가)
**Storage**: Supabase (서버), localStorage (클라이언트 캐시)
**Testing**: 없음 (현 프로젝트 패턴 유지)
**Target Platform**: 웹 브라우저 (모바일/데스크탑)
**Project Type**: Web application
**Performance Goals**: 탭 전환 시 0ms 추가 지연, 쓰기 반영 0.1초 이내
**Constraints**: 오프라인 쓰기 미지원, 캐시 TTL 24시간
**Scale/Scope**: 단일 사용자, 수백 건 이내 아이템

---

## Constitution Check

*Constitution이 아직 프로젝트별 원칙으로 채워지지 않아 일반 원칙으로 검사.*

| 원칙 | 상태 | 비고 |
|------|------|------|
| 과도한 복잡성 없음 | ✅ | SWR 단일 라이브러리 추가, 커스텀 상태관리 없음 |
| 기존 구조 유지 | ✅ | 기존 API 라우트 변경 없음, 컴포넌트 구조 유지 |
| 최소 의존성 | ✅ | SWR 1개만 추가 (~3.7KB) |
| 점진적 마이그레이션 | ✅ | 훅 도입 후 기존 fetch 코드를 단계별 교체 |

---

## Project Structure

### Documentation (this feature)

```text
specs/005-data-caching-fast-ux/
├── plan.md              # 이 파일
├── research.md          # 기술 선택 근거
├── data-model.md        # 캐시 개념 모델 + useItems 인터페이스
├── contracts/
│   ├── useItems-hook.md # 훅 인터페이스 계약
│   └── toast-contract.md
└── tasks.md             # /speckit.tasks 명령으로 생성
```

### Source Code (repository root)

```text
lib/
├── hooks/
│   └── useItems.ts          # SWR 기반 아이템 CRUD + 캐시 훅 (신규)
└── providers/
    └── SWRProvider.tsx      # localStorage 영속 캐시 + SWRConfig 래퍼 (신규)

components/
├── Items/
│   └── StatusDropdown.tsx   # 상태 뱃지 클릭 시 드롭다운 팝오버 (신규)
└── UI/
    └── Toast.tsx            # 토스트 알림 컴포넌트 (신규)

app/
├── layout.tsx               # SWRProvider 래핑 추가 (수정)
├── research/
│   └── page.tsx             # useItems 훅으로 교체 (수정)
└── schedule/
    └── page.tsx             # useItems 훅으로 교체 (수정)

components/
├── Panel/
│   └── PanelItemForm.tsx    # useItems 훅으로 저장/삭제 교체 (수정)
└── Items/
    └── ItemCard.tsx         # StatusDropdown 통합 (수정)
```

**Structure Decision**: 기존 `lib/`, `components/`, `app/` 구조를 그대로 유지하면서 신규 파일을 추가. 기존 API 라우트(`app/api/items/`)는 변경 없음.

---

## Complexity Tracking

해당 없음. 기존 구조에 SWR 추가만으로 요구사항 충족 가능.

---

## Phase 0: Research

**Status**: ✅ 완료

→ [research.md](./research.md) 참조

핵심 결정:
- **SWR** 채택 (stale-while-revalidate, 낙관적 업데이트, localStorage provider 패턴)
- **localStorage** 영속 캐시 (SWR provider 패턴, 24h TTL)
- **커스텀 Toast** 컴포넌트 (외부 의존성 없음)
- **커스텀 StatusDropdown** 컴포넌트 (Tailwind + React state)

---

## Phase 1: Design & Contracts

**Status**: ✅ 완료

### Data Model

→ [data-model.md](./data-model.md) 참조

핵심 개념:
- `ItemsCache`: SWR 내부 캐시 + localStorage 영속화
- `OptimisticOperation`: 낙관적 연산 단위 (snapshot + payload)
- `SyncStatus`: 캐시 상태 열거 (fresh/stale/offline/error)
- `UseItemsReturn`: 모든 페이지/컴포넌트의 단일 데이터 진입점

### Contracts

→ [contracts/useItems-hook.md](./contracts/useItems-hook.md)
→ [contracts/toast-contract.md](./contracts/toast-contract.md)

### 구현 순서 (의존성 기준)

```
1. SWRProvider (localStorage 캐시 기반)
   ↓
2. useItems 훅 (SWR + 낙관적 업데이트)
   ↓
3. Toast 컴포넌트 (알림 표시)
   ↓
4. layout.tsx 수정 (SWRProvider 래핑)
   ↓
5. research/page.tsx, schedule/page.tsx 마이그레이션
   ↓
6. PanelItemForm.tsx 마이그레이션 (useItems 쓰기 연산)
   ↓
7. StatusDropdown 컴포넌트 (빠른 상태 토글)
   ↓
8. ItemCard.tsx 수정 (StatusDropdown 통합)
```

### SWR 설정 요약

```typescript
// SWRProvider 핵심 설정
{
  provider: localStorageProvider,  // 영속 캐시
  revalidateOnFocus: true,         // 포커스 복귀 시 자동 갱신
  focusThrottleInterval: 30_000,   // 30초 미만 재방문은 갱신 생략 (SC-004)
  revalidateOnReconnect: true,     // 네트워크 재연결 시 갱신 (FR-014)
  dedupingInterval: 5_000,         // 5초 내 중복 요청 제거
  shouldRetryOnError: false,       // 에러 자동 재시도 없음 (사용자가 재시도 버튼으로)
}
```

### 낙관적 업데이트 핵심 패턴

```typescript
// useItems.ts 내부 패턴 (updateItem 예시)
async function updateItem(id: string, changes: Partial<TripItem>) {
  const snapshot = cache.get('/api/items')  // 롤백용 스냅샷

  // 즉시 반영 (낙관적)
  mutate(
    { items: items.map(i => i.id === id ? { ...i, ...changes } : i) },
    { revalidate: false }
  )

  try {
    await fetch(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(changes) })
    mutate()  // 서버 재검증
  } catch {
    mutate(snapshot, { revalidate: false })  // 롤백
    showToast({ message: '저장 실패', type: 'error', action: { label: '재시도', onClick: () => updateItem(id, changes) } })
  }
}
```
