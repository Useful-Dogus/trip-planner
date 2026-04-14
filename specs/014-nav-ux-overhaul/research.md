# Research: Trip Planner 다음 버전 UX 개편

## 1. 현재 코드베이스 상태

### Navigation 구조
- `components/Layout/Navigation.tsx`: 4개 탭 (리서치→`/research`, 일정→`/schedule`, 추가→`/items/new`, 지도연동→`/gmaps-import`)
- 모바일: 하단 고정 (`md:hidden`), safe-area-inset-bottom 지원
- 데스크탑: 좌측 사이드바 (`md:w-44`)

### 뷰 토글
- `app/research/page.tsx`: `useState<'list'|'table'|'map'>` 로컬 상태로 뷰 전환
- `app/schedule/page.tsx`: `useState<'table'|'map'>` 로컬 상태
- 삭제 대상: 리서치 뷰 토글 버튼 (3개) → 기기별 자동 결정으로 대체

### selectedItemId 위치
- 각 페이지 로컬 state (`useState<string|null>`)
- URL param 없음 → URL param 추가 필요
- `ItemPanel`은 parent props로 제어 (`isOpen`, `onClose`)

### gmaps-import 완료 처리
- `app/gmaps-import/page.tsx` done 상태: 정적 `<a href="/research">리서치로 이동</a>`
- 자동 리다이렉트 없음, 하이라이트 없음
- → `router.push('/research?imported=id1,id2')` 패턴으로 변경

### Schedule 미배정 처리
- `components/Schedule/ScheduleTable.tsx`: `UNDATED_KEY = '__undated__'`
- 미배정 항목이 **맨 아래**에 위치 (정렬 로직에서 항상 마지막)
- → **맨 위**의 접을 수 있는 섹션으로 이동

### 테이블 overflow 버그
- `components/Research/ResearchTable.tsx:155`: `overflow-hidden` on wrapper div
- 수정: `overflow-x-auto` 로 변경

### FAB
- 존재하지 않음 → 신규 `components/UI/FAB.tsx` 생성

---

## 2. 기술 결정 사항

### Decision 1: 기기 분기 방법
- **선택**: CSS Tailwind 반응형 클래스 (`md:hidden`, `hidden md:block`)
- **근거**: 추가 hook/라이브러리 없이 Next.js SSR 친화적. 현재 코드에서 이미 동일 패턴 사용.
- **대안**: `useMediaQuery` hook — 하이드레이션 불일치 위험, 불필요한 복잡도.

### Decision 2: URL param 패널 상태 (`?item=ID`)
- **선택**: `useSearchParams` + `router.replace` (Next.js App Router 내장)
- **근거**: App Router에서 권장 패턴. `push` 대신 `replace`로 히스토리 오염 방지.
- **동작**: 패널 열기 → `router.replace('?item=ID')`, 닫기 → `router.replace('?')` 또는 파라미터 제거
- **대안**: localStorage — URL 공유 불가, SSR mismatch.

### Decision 3: 임포트 완료 후 하이라이트 전달
- **선택**: URL query param `?imported=id1,id2` → 리서치(전체) 탭에서 파싱 후 sessionStorage 클리어
- **근거**: 단순하고 상태 공유 없이 동작. 새로고침 후 하이라이트 미적용은 의도된 동작.
- **대안**: React Context/전역 상태 — 이 앱은 1페이지 앱이 아니므로 페이지 이동 시 상태 소멸.

### Decision 4: 오늘 자동 스크롤
- **선택**: `useEffect` + `element.scrollIntoView({ behavior: 'smooth', block: 'start' })`
- **근거**: 표준 웹 API, 추가 의존성 없음.
- **조건**: 오늘 날짜 그룹에 아이템이 1개 이상일 때만 실행.

### Decision 5: 지도 탭 라우트
- **선택**: 기존 `/research` 내 `ResearchMap` 사용, 지도 탭은 `/map` 신규 라우트
- **근거**: ResearchMap이 이미 전체 아이템을 표시. ScheduleMap과 통합은 별도 이슈.
- **범위 제외**: ScheduleMap 제거는 이번 PR 범위 밖.

### Decision 6: 전체 탭 라우트
- **선택**: 기존 `/research` 경로 유지, 탭 레이블만 "전체"로 변경
- **근거**: 기존 URL bookmark 호환성. 리다이렉트 불필요.

---

## 3. 변경 파일 목록 (예상)

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `components/Layout/Navigation.tsx` | 수정 | 탭 3개로 변경, 지도연동 보조 버튼 추가 |
| `app/research/page.tsx` | 수정 | 뷰 토글 제거, URL param 패널 상태, 임포트 하이라이트, FAB |
| `app/schedule/page.tsx` | 수정 | URL param 패널 상태 |
| `app/map/page.tsx` | 신규 | 통합 지도 탭 (ResearchMap 재사용) |
| `components/Research/ResearchTable.tsx` | 수정 | overflow-hidden → overflow-x-auto |
| `components/Schedule/ScheduleTable.tsx` | 수정 | 미배정 버킷 상단 이동, 오늘 자동 스크롤, "오늘" 배지 |
| `components/UI/FAB.tsx` | 신규 | 모바일 FAB 컴포넌트 |
| `app/gmaps-import/page.tsx` | 수정 | 완료 후 router.push + imported IDs 전달 |
