# Research: 데이터 캐싱 및 빠른 UX 전략

**Feature**: 005-data-caching-fast-ux
**Date**: 2026-03-27

---

## 1. 캐싱 라이브러리 선택

**Decision**: SWR

**Rationale**:
- Vercel(Next.js 제작사) 공식 라이브러리로 App Router 최적화 지원
- 번들 크기 ~3.7KB (gzip) — TanStack Query(~12KB) 대비 경량
- stale-while-revalidate 전략이 라이브러리 이름이자 기본 동작 — 추가 설정 불필요
- `mutate` API로 낙관적 업데이트 + 롤백 구현 가능
- 현재 `fetch + useState` 패턴과 API 유사, 마이그레이션 난이도 낮음

**Alternatives Considered**:
- **TanStack Query**: `optimisticData` 내장 옵션으로 롤백 처리가 더 선언적이지만, 번들 크기 3배 이상이고 현 프로젝트 데이터 규모(수백 건)에 과도하다. 복잡한 의존 쿼리나 페이지네이션이 없으므로 채택 안 함.
- **Custom Hook**: 재구현 비용(stale-while-revalidate, 중복 요청 제거, 포커스 복귀 재검증 등)이 SWR 도입보다 크다. 채택 안 함.

---

## 2. 영속 캐시 저장소

**Decision**: localStorage + SWR Provider 패턴

**Rationale**:
- SWR는 `SWRConfig`의 `provider` 옵션으로 커스텀 캐시 저장소를 주입할 수 있음
- `new Map(JSON.parse(localStorage.getItem('swr-cache') || '[]'))` 패턴으로 구현
- 세션 종료 후에도 데이터 유지 → 새로고침 시 즉시 표시 가능
- 24시간 TTL은 캐시 저장 시 타임스탬프 기록 후 읽기 시점에 만료 여부 확인

**Alternatives Considered**:
- **sessionStorage**: 탭 닫으면 사라짐 — 새로고침 즉시 표시(FR-004) 불만족. 채택 안 함.
- **IndexedDB**: 비동기 API로 SWR Provider 패턴 구현 복잡. 수백 건 데이터에 과도. 채택 안 함.
- **메모리만 사용**: 새로고침 후 즉시 표시 불가. FR-004 불만족. 채택 안 함.

---

## 3. 낙관적 업데이트 패턴

**Decision**: `mutate(optimisticData, { revalidate: false })` → 서버 요청 → 성공 시 `mutate()` 재검증 / 실패 시 이전 데이터로 롤백

**Pattern**:
```
1. 현재 캐시 스냅샷 저장 (rollback 대비)
2. mutate(updatedData, { revalidate: false }) // 즉시 UI 반영
3. await serverFetch()
   - 성공 → mutate() // 서버 응답으로 재검증
   - 실패 → mutate(snapshot, { revalidate: false }) // 롤백
           → 토스트 실패 알림 표시
```

**Alternatives Considered**:
- **SWR `optimisticData` 옵션**: SWR v2에서 지원하지만, 롤백 커스터마이징이 수동 패턴보다 제한적. 수동 패턴이 더 명확하고 재시도 버튼 로직 연결이 용이.

---

## 4. 토스트 알림

**Decision**: 커스텀 경량 Toast 컴포넌트

**Rationale**:
- 프로젝트가 외부 UI 라이브러리를 사용하지 않고 Tailwind CSS로 직접 구현하는 패턴 유지
- 재시도 버튼 포함, 4초 자동 소멸, 위치(하단 중앙) 등 요구사항이 단순 — 라이브러리 불필요
- 기존 `components/UI/` 디렉토리 구조 활용

**Alternatives Considered**:
- **sonner**: ~2KB로 경량이고 기능 완성도 높음. 단 외부 의존성 추가이므로 현 프로젝트 패턴과 맞지 않아 채택 안 함. 구현 복잡도가 높아지면 재검토 가능.

---

## 5. 상태 드롭다운 (Status Dropdown)

**Decision**: 커스텀 Popover 컴포넌트 (Tailwind + React state)

**Rationale**:
- 이미 Tailwind CSS가 있어 Popover UI 구현이 간단
- Radix UI / Headless UI 등 추가 라이브러리 불필요
- 접근성(키보드 탐색, ESC 닫기, 외부 클릭 닫기)은 `useRef` + `useEffect` 조합으로 충분

---

## 6. Next.js App Router 통합 주의사항

- SWR 훅은 `'use client'` 컴포넌트에서만 사용 가능 — 기존 페이지 컴포넌트(`research/page.tsx`, `schedule/page.tsx`)에 이미 `'use client'`가 선언되어 있어 영향 없음
- `SWRProvider`는 `app/layout.tsx`에서 클라이언트 컴포넌트로 감싸야 함 (별도 `providers.tsx` 파일로 분리 권장)
- localStorage 접근은 서버 사이드에서 불가 — `typeof window !== 'undefined'` 가드 필요
- `revalidateOnFocus: true`(SWR 기본값)로 포커스 복귀 자동 갱신 지원. `focusThrottleInterval`을 30초로 설정해 SC-004 만족.
