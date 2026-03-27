# Quickstart: 데이터 캐싱 및 빠른 UX 구현

**Feature**: 005-data-caching-fast-ux

---

## 1. SWR 설치

```bash
npm install swr
```

---

## 2. 핵심 파일 생성 순서

### Step 1: SWRProvider (`lib/providers/SWRProvider.tsx`)

localStorage를 SWR 캐시 저장소로 사용하는 Provider. `app/layout.tsx`에서 전체 앱을 감싼다.

핵심 설정:
- `focusThrottleInterval: 30_000` → SC-004 (30초+ 방치 후 복귀 시 자동 갱신)
- `revalidateOnFocus: true` → 포커스 복귀 시 갱신 트리거
- `revalidateOnReconnect: true` → 네트워크 재연결 시 갱신 (FR-014)

### Step 2: useItems 훅 (`lib/hooks/useItems.ts`)

모든 CRUD 연산의 단일 진입점. 계약은 [contracts/useItems-hook.md](./contracts/useItems-hook.md) 참조.

### Step 3: Toast 컴포넌트 (`components/UI/Toast.tsx`)

하단 중앙 위치, 4초 자동 소멸, 재시도 버튼 지원. 계약은 [contracts/toast-contract.md](./contracts/toast-contract.md) 참조.

### Step 4: layout.tsx 수정

```tsx
// app/layout.tsx
import { SWRProvider } from '@/lib/providers/SWRProvider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SWRProvider>
          {children}
        </SWRProvider>
      </body>
    </html>
  )
}
```

### Step 5: 페이지 마이그레이션

기존 `useEffect + fetch` 패턴을 `useItems` 훅으로 교체. 마이그레이션 가이드는 [contracts/useItems-hook.md](./contracts/useItems-hook.md#migration-guide) 참조.

### Step 6: StatusDropdown 컴포넌트 (`components/Items/StatusDropdown.tsx`)

상태 뱃지 클릭 시 팝오버로 전체 상태 목록 표시. 선택 시 `updateStatus` 호출.

### Step 7: ItemCard.tsx 수정

상태 뱃지를 `StatusDropdown` 컴포넌트로 교체.

---

## 3. 검증 체크리스트

- [ ] 탭 전환 시 스켈레톤 미표시 (SC-001)
- [ ] 저장 버튼 클릭 후 0.1초 내 목록 반영 (SC-002)
- [ ] 새로고침 후 즉시 데이터 표시 — 빈 화면 없음 (SC-003)
- [ ] 30초+ 방치 후 탭 전환 시 백그라운드 갱신 시작 (SC-004)
- [ ] 서버 오류 시 롤백 + 토스트 알림 표시 (SC-005)
- [ ] 오프라인 상태에서 캐시 데이터 탐색 가능 (SC-006)
- [ ] 카드 상태 뱃지 클릭 → 드롭다운 → 선택 즉시 반영 (SC-007)
