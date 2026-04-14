# Implementation Plan: Trip Planner 다음 버전 UX 개편

**Branch**: `014-nav-ux-overhaul` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/014-nav-ux-overhaul/spec.md`

## Summary

현재 4탭(리서치, 일정, 추가, 지도연동) 구조를 3탭(전체, 일정, 지도)으로 개편하고, 기기별 뷰를 자동 결정(모바일=카드, 데스크탑=테이블)하며, 모바일 FAB 추가, 테이블 overflow 버그 수정, 일정 탭 미배정 버킷+오늘 자동스크롤, 임포트 완료 후 자동 이동+하이라이트, URL param 패널 상태 복원을 구현한다.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: Next.js 14 (App Router), React 18, Tailwind CSS 3.x, SWR  
**Storage**: N/A (UI 전용 변경, 데이터 모델 변경 없음)  
**Testing**: `npm run build` + `npm run lint`  
**Target Platform**: Web (모바일 < 768px, 데스크탑 ≥ 768px)  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: 뷰 전환 즉시 반응 (CSS 기반), 자동 스크롤 smooth  
**Constraints**: SSR 호환, 하이드레이션 mismatch 없음  
**Scale/Scope**: UI 컴포넌트 8개 파일 수정/신규

## Constitution Check

Constitution 파일이 미완성(플레이스홀더)이므로 프로젝트 CLAUDE.md 기준으로 검증:

- [x] TypeScript + Next.js 14 App Router 스택 준수
- [x] Tailwind CSS 사용 (신규 CSS 파일 불필요)
- [x] 데이터 모델 변경 없음 (Supabase 스키마 변경 없음)
- [x] 기존 컴포넌트 패턴 재사용 (ItemPanel, ItemList, ResearchMap)

## Project Structure

### Documentation (this feature)

```text
specs/014-nav-ux-overhaul/
├── plan.md          ← 이 파일
├── research.md      ← Phase 0 완료
├── data-model.md    ← Phase 1 완료 (UI-only, 변경 없음)
├── spec.md
└── tasks.md         ← /speckit.tasks 출력 (미생성)
```

### Source Code (변경 대상)

```text
app/
├── research/page.tsx          # 수정: 뷰 토글 제거, URL param, FAB, 하이라이트
├── schedule/page.tsx          # 수정: URL param 패널 상태
├── map/page.tsx               # 신규: 통합 지도 탭
└── gmaps-import/page.tsx      # 수정: 완료 후 router.push + imported IDs

components/
├── Layout/Navigation.tsx      # 수정: 3탭, 지도연동 보조 버튼
├── Research/ResearchTable.tsx # 수정: overflow-x-auto
├── Schedule/ScheduleTable.tsx # 수정: 미배정 버킷 상단, 오늘 자동스크롤
└── UI/FAB.tsx                 # 신규: 모바일 FAB
```

**Structure Decision**: Next.js App Router 단일 프로젝트. 기존 구조 유지하며 최소 파일 추가.

---

## 구현 설계

### 1. Navigation 개편 (`components/Layout/Navigation.tsx`)

```
Before: [리서치] [일정] [추가] [지도연동]
After:  [전체]   [일정] [지도]
```

- `navItems` 배열에서 `/items/new`, `/gmaps-import` 제거
- 지도 탭 추가: `{ href: '/map', label: '지도', icon: <MapIcon/> }`
- 데스크탑 사이드바 하단: 지도연동(gmaps-import) 아이콘 버튼 추가 (작은 보조 버튼)
- "리서치" 레이블 → "전체" 로 변경

### 2. 기기별 뷰 자동결정 (`app/research/page.tsx`)

- `tab` state 제거 (`useState<'list'|'table'|'map'>` 삭제)
- TabSwitcher 컴포넌트 제거
- 렌더링 구조:
  ```tsx
  {/* 모바일 전용 */}
  <div className="md:hidden">
    <ItemList ... />
    <FAB />
  </div>
  {/* 데스크탑 전용 */}
  <div className="hidden md:block">
    <ResearchTable ... />
  </div>
  ```

### 3. FAB (`components/UI/FAB.tsx`)

```tsx
// 우하단 고정, safe-area 위 배치
<button
  className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-blue-600 
             text-white shadow-lg flex items-center justify-center
             [padding-bottom:env(safe-area-inset-bottom)]"
  onClick={() => router.push('/items/new')}
>
  <PlusIcon />
</button>
```

- `bottom-24`: 하단 네비게이션(56px) + 여유 (96px total)
- 전체 탭(`/research`)에서만 렌더링

### 4. 테이블 overflow 버그 수정 (`components/Research/ResearchTable.tsx`)

```diff
- <div className="border border-gray-100 rounded-xl overflow-hidden">
+ <div className="border border-gray-100 rounded-xl overflow-x-auto">
```

### 5. 지도 탭 (`app/map/page.tsx`)

- 신규 파일, `ResearchMap` 재사용
- `selectedItemId` state + `ItemPanel` 포함
- URL param 패널 상태 패턴 적용

### 6. URL param 패널 상태

`app/research/page.tsx`, `app/schedule/page.tsx`, `app/map/page.tsx` 공통 패턴:

```tsx
const router = useRouter()
const searchParams = useSearchParams()
const [selectedItemId, setSelectedItemId] = useState<string | null>(
  () => searchParams.get('item')
)

// 패널 열기
const handleSelectItem = (id: string | null) => {
  setSelectedItemId(id)
  const params = new URLSearchParams(searchParams.toString())
  if (id) params.set('item', id)
  else params.delete('item')
  router.replace(`?${params.toString()}`, { scroll: false })
}

// 마운트 시 invalid ID 처리
useEffect(() => {
  const paramId = searchParams.get('item')
  if (paramId && items.length > 0 && !items.find(i => i.id === paramId)) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('item')
    router.replace(`?${params.toString()}`, { scroll: false })
  }
}, [items])
```

### 7. 임포트 완료 후 자동 이동 + 하이라이트 (`app/gmaps-import/page.tsx`)

```tsx
// done 상태 진입 시
useEffect(() => {
  if (state === 'done' && insertedIds.length > 0) {
    router.push(`/research?imported=${insertedIds.join(',')}`)
  } else if (state === 'done') {
    router.push('/research')
  }
}, [state])
```

`app/research/page.tsx` 에서 하이라이트 처리:

```tsx
const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set())

useEffect(() => {
  const imported = searchParams.get('imported')
  if (imported) {
    const ids = new Set(imported.split(','))
    setHighlightedIds(ids)
    // URL에서 imported param 제거
    const params = new URLSearchParams(searchParams.toString())
    params.delete('imported')
    router.replace(`?${params.toString()}`, { scroll: false })
    // 1000ms 후 하이라이트 제거
    setTimeout(() => setHighlightedIds(new Set()), 1000)
  }
}, [])
```

`ItemCard`/`ItemList`에 `highlightedIds` prop 전달, Tailwind `animate-pulse` 또는 커스텀 fade-out 클래스 적용.

### 8. 일정 탭 미배정 버킷 (`components/Schedule/ScheduleTable.tsx`)

현재: 미배정(`UNDATED_KEY`) 항목이 그룹 맨 아래
변경: 미배정 항목을 별도 추출 → 최상단 접을 수 있는 섹션으로 이동

```tsx
// 그룹에서 미배정 항목 분리
const undatedItems = groupedItems[UNDATED_KEY] ?? []
const datedEntries = Object.entries(groupedItems)
  .filter(([key]) => key !== UNDATED_KEY)
  .sort(([a], [b]) => a.localeCompare(b))

// 미배정 섹션 상태
const [undatedCollapsed, setUndatedCollapsed] = useState(false)
```

렌더링 순서:
1. 미배정 섹션 (있을 때만) - 접기/펼치기 가능
2. 날짜 그룹 (기존 순서)

### 9. 오늘 날짜 자동 스크롤 (`components/Schedule/ScheduleTable.tsx`)

```tsx
const todayKey = new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
const todayRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  if (todayRef.current && groupedItems[todayKey]?.length > 0) {
    todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}, []) // 마운트 시 1회만

// 오늘 섹션 헤더
<div ref={key === todayKey ? todayRef : undefined}>
  {formatDate(key)}
  {key === todayKey && <span className="badge">오늘</span>}
</div>
```
