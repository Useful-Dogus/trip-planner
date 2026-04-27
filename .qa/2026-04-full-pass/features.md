# features.md — trip-planner 기능 지도
> AI ① Feature Investigator 산출물. 결함 평가 없음.
> 생성일: 2026-04-27

## 개요
개인 여행 플래너(NYC 2026년 7월). Next.js 14 App Router + React 18 + Supabase. 여행 항목을 생성·관리하며 리서치/일정/지도 뷰에서 탐색. 구글맵 저장 목록 일괄 임포트 가능.

---

## 인증 (Authentication)

```yaml
id: F-001
name: 로그인
area: 인증
user_flow: /login → 아이디/비밀번호 입력 → POST /api/auth/login → JWT 쿠키 → /research 리다이렉트
inputs: AUTH_ID(text), AUTH_PASSWORD(password)
states: 입력 가능 | 로딩 | 성공 | 인증 실패
permissions: 비로그인 가능
dependencies: /api/auth/login, jose, next/navigation
observed_behavior: 환경변수 기반 단일 계정. 성공 시 http-only 쿠키(maxAge 7일). 실패 시 401 + 에러 메시지. 성공 후 window.location.href로 full reload(라우터 캐시 무효화).
spec_reference: specs/001-trip-planner-mvp
uncertainty: 단일 계정 방식임을 확인. 다중 사용자 미지원.
```

```yaml
id: F-002
name: 로그아웃
area: 인증
user_flow: 사이드바 "로그아웃" 클릭 → POST /api/auth/logout → 쿠키 삭제 → /login 리다이렉트
inputs: 없음
states: 클릭 가능
permissions: 로그인 필요
dependencies: /api/auth/logout, useRouter
observed_behavior: auth 쿠키를 maxAge=0으로 삭제. window.location.href=/login으로 전체 리로드.
spec_reference: 없음
uncertainty: 없음
```

```yaml
id: F-003
name: 인증 미들웨어 (라우트 보호)
area: 인증
user_flow: 모든 보호 라우트 요청 → middleware.ts JWT 검증 → 유효: 통과 / 무효: /login 리다이렉트
inputs: 쿠키의 auth 토큰
states: 인증됨 | 미인증 | 만료
permissions: 자동
dependencies: middleware.ts, jose(verifyToken)
observed_behavior: /research /schedule /items/* /gmaps-import /map 및 /api/items /api/geocode /api/gmaps/* 보호. 페이지는 /login 리다이렉트, API는 401 JSON.
spec_reference: 없음
uncertainty: 없음
```

---

## 항목 관리 (Item Management)

```yaml
id: F-004
name: 항목 생성 (풀 폼)
area: 항목관리
user_flow: /items/new → ItemForm 렌더 → 필드 입력 → 저장 → POST /api/items → /research 리다이렉트
inputs: 이름(필수), 분류, 우선순위, 예약상태, 날짜, 시작시간, 종료시간, 예산, 주소, 좌표, 링크배열, 메모
states: 입력 | 유효성검증 | 지오코딩 | 저장 | 완료 | 에러
permissions: 로그인 필요
dependencies: /api/items(POST), /api/geocode(GET)
observed_behavior: 이름 필수. 주소 blur 시 지오코딩 자동 실행. 날짜 2026-07-01~31 범위 검증. 날짜 없으면 시간 비활성. URL 빈 링크는 저장 제외. 저장 후 /research 리다이렉트.
spec_reference: specs/007-item-metadata-ux, specs/008-item-end-time
uncertainty: 지오코딩 실패 시 좌표 없이 저장됨 — 지도에 표시 불가.
```

```yaml
id: F-005
name: 항목 생성 (테이블 인라인)
area: 항목관리
user_flow: 테이블 하단 "+ 항목 추가…" 클릭 → 인라인 입력 → 이름 입력 → Enter/blur → POST /api/items
inputs: 이름만 (나머지 기본값)
states: 버튼 | 입력 | 저장 | 완료
permissions: 로그인 필요
dependencies: /api/items(POST), ResearchTable, ScheduleTable
observed_behavior: 분류='기타', 우선순위='검토필요', links=[] 기본값. Escape=취소, Enter/blur=저장(이름 있을 때).
spec_reference: specs/012-inline-table-view
uncertainty: 없음
```

```yaml
id: F-006
name: 항목 조회 (상세 페이지)
area: 항목관리
user_flow: /items/[id] → SSR 렌더 → 배지·일정·위치·링크·메모 표시
inputs: URL 파라미터 id (UUID)
states: 렌더링 | 404
permissions: 로그인 필요
dependencies: readItems(lib/data.ts), next notFound()
observed_behavior: SSR. 없는 항목은 notFound(). 링크는 target=_blank rel=noopener noreferrer. 메모는 whitespace-pre-wrap.
spec_reference: 없음
uncertainty: 없음
```

```yaml
id: F-007
name: 항목 수정 (풀 폼)
area: 항목관리
user_flow: /items/[id]/edit → ItemForm(mode=edit) → 기존값 로드 → 수정 → PUT /api/items/[id] → /items/[id] 리다이렉트
inputs: F-004와 동일, 기존값 초기화
states: 로딩 | 편집 | 저장 | 완료
permissions: 로그인 필요
dependencies: /api/items/[id](PUT), /api/geocode(GET)
observed_behavior: 삭제 버튼 노출. 날짜 비우면 time_start도 null 설정. 저장 후 /items/[id] 리다이렉트.
spec_reference: specs/007-item-metadata-ux
uncertainty: 없음
```

```yaml
id: F-008
name: 항목 삭제
area: 항목관리
user_flow: 삭제 버튼 → confirm 다이얼로그 → DELETE /api/items/[id] → 리스트 복귀
inputs: 항목 ID
states: 버튼 | 확인대기 | 삭제 | 완료
permissions: 로그인 필요
dependencies: /api/items/[id](DELETE), useItems
observed_behavior: confirm() 표시. 확인 시 DELETE. ItemPanel에서 삭제 후 onDelete(id)로 패널 자동 닫힘.
spec_reference: 없음
uncertainty: 없음
```

```yaml
id: F-009
name: 항목 수정 (인라인 — 테이블)
area: 항목관리
user_flow: ResearchTable/ScheduleTable 셀 클릭 → 인라인 입력 활성 → 값 수정 → Tab/Enter/blur → PUT /api/items/[id]
inputs: 이름/분류/우선순위/예약상태/예산(Research), 시간/이름/분류/예약상태/예산(Schedule)
states: 보기 | 편집 | 저장
permissions: 로그인 필요
dependencies: /api/items/[id](PUT), 셀 컴포넌트들
observed_behavior: 드롭다운은 Portal로 document.body에 렌더. Tab=다음셀, Shift+Tab=이전셀, Enter=다음행, Esc=취소. 외부(data-portal/data-research-row 제외) 클릭 시 편집 종료. 드롭다운 선택 시 자동저장 후 다음셀 포커스.
spec_reference: specs/012-inline-table-view
uncertainty: 없음
```

```yaml
id: F-010
name: 항목 수정 (인라인 — 패널)
area: 항목관리
user_flow: ItemPanel(view 모드) → 필드 클릭 → 인라인 편집 → Enter/blur → PUT /api/items/[id]
inputs: 이름/예산/날짜/시간/주소/메모/링크/분류/우선순위/예약상태
states: 보기 | 편집 | 지오코딩 | 저장
permissions: 로그인 필요
dependencies: /api/items/[id](PUT), /api/geocode(GET), ItemDetailView
observed_behavior: 필드 클릭으로 인라인 입력 전환. 주소 blur 시 지오코딩. 드롭다운은 Portal. Esc=원래값 복원. Enter/blur=저장.
spec_reference: 없음
uncertainty: 링크 편집 저장 타이밍 (개별 vs 일괄).
```

---

## 리서치 뷰 (Research View)

```yaml
id: F-011
name: 목록 뷰 — 모바일 카드
area: 리서치뷰
user_flow: /research → ItemList 렌더 → 카드 그리드
inputs: items, selectedItemId, filterState, sortKey
states: 로딩 | 빈상태 | 데이터 | 검색없음
permissions: 로그인 필요
dependencies: ItemList, ItemCard, GroupCard, FilterPanel, SortButton
observed_behavior: md 이하에서만 표시. 빈상태='아직 항목이 없어요', 검색결과없음='검색 결과가 없어요'. 하단 FAB(+추가).
spec_reference: 없음
uncertainty: 없음
```

```yaml
id: F-012
name: 테이블 뷰 — 데스크톱
area: 리서치뷰
user_flow: /research → ResearchTable 렌더 → 인라인 편집 가능 테이블
inputs: filteredItems, sortState
states: 로딩 | 빈상태 | 데이터
permissions: 로그인 필요
dependencies: ResearchTable, ResearchTableRow, 셀 컴포넌트
observed_behavior: md 이상에서만 표시. 컬럼 헤더 클릭으로 정렬. 행 호버 시 상세버튼(…). 하단 '+ 항목 추가…'.
spec_reference: specs/012-inline-table-view
uncertainty: 없음
```

```yaml
id: F-013
name: 검색 (이름·주소·메모)
area: 리서치뷰
user_flow: 검색바 → 텍스트 입력 → 실시간 필터
inputs: 검색어
states: 없음(전체) | 입력 | 결과있음 | 결과없음
permissions: 로그인 필요
dependencies: useMemo, ItemList, ResearchTable
observed_behavior: trim().toLowerCase()로 정규화. name+address+memo를 공백 조인한 haystack에 포함 여부. 실시간(debounce 없음).
spec_reference: specs/079-search-multi-field
uncertainty: 없음
```

```yaml
id: F-014
name: 필터 (분류·우선순위·예약상태)
area: 리서치뷰
user_flow: 필터 버튼 → FilterPanel 열기 → 체크박스 선택 → 자동 적용
inputs: categories[], tripPriorities[], reservationStatuses[], showExcluded
states: 패널닫힘 | 패널열림 | 필터적용
permissions: 로그인 필요
dependencies: FilterPanel, FilterButton, ActiveFilterChips
observed_behavior: 모바일=바텀시트, 데스크톱=포지션 드롭다운. '제외 포함' 옵션. 활성 필터는 칩으로 표시.
spec_reference: specs/013-filter-ui-mobile
uncertainty: 없음
```

```yaml
id: F-015
name: 정렬 (이름·날짜·예산·우선순위)
area: 리서치뷰
user_flow: SortButton → 정렬키 선택 → asc/desc 토글
inputs: sortKey, sortDir
states: 정렬없음 | 정렬적용
permissions: 로그인 필요
dependencies: SortButton, ItemList
observed_behavior: 처음 선택=asc, 재선택=desc. localeCompare('ko') 한글 지원. 모바일 목록 뷰에서만 (데스크톱은 헤더 클릭).
spec_reference: 없음
uncertainty: 없음
```

```yaml
id: F-016
name: 체인 그룹핑 (모바일)
area: 리서치뷰
user_flow: ItemList → 동명(2개 이상) 항목 → GroupCard → 클릭으로 서브항목 펼침/접음
inputs: items 배열 (이름 기반 자동 그룹)
states: 접힘 | 펼침
permissions: 로그인 필요
dependencies: ItemList, GroupCard
observed_behavior: name.trim().toLowerCase() 기준 그룹. 필터 적용 후 visibleItems만 포함. totalCount는 필터 전 전체. 정렬 시 group의 sortKey는 visibleItems의 최솟값/최댓값 사용.
spec_reference: specs/011-chain-grouping
uncertainty: 없음
```

```yaml
id: F-017
name: 활성 필터 칩
area: 리서치뷰
user_flow: 필터 선택 → ActiveFilterChips 렌더 → 칩 X로 개별 제거
inputs: filterState
states: 필터없음 | 필터있음
permissions: 로그인 필요
dependencies: ActiveFilterChips
observed_behavior: 각 필터값·showExcluded에 칩 생성. X 클릭 시 해당 필터 제거.
spec_reference: 없음
uncertainty: 없음
```

```yaml
id: F-018
name: 임포트 완료 하이라이트
area: 리서치뷰
user_flow: /research?imported=id1,id2 → 해당 항목 배경 강조 → 1초 후 해제
inputs: URL 파라미터 imported
states: 강조 | 해제
permissions: 로그인 필요
dependencies: useSearchParams, useRouter, setTimeout
observed_behavior: 마운트 시 1회 실행. Set으로 highlightedIds 관리. 1초 후 초기화 + URL 파라미터 제거(replace).
spec_reference: 없음
uncertainty: 없음
```

---

## 일정 뷰 (Schedule View)

```yaml
id: F-019
name: 날짜별 그룹 일정 뷰
area: 일정뷰
user_flow: /schedule 또는 /research "일정" 탭 → ScheduleTable → 날짜별 그룹
inputs: items 배열
states: 로딩 | 빈상태 | 그룹표시
permissions: 로그인 필요
dependencies: ScheduleTable, DateGroupHeader, TableRow, MobileScheduleItemCard
observed_behavior: 날짜순 정렬. '__undated__' 키로 날짜없는 항목 그룹화. 모바일=카드, 데스크톱=테이블. DateGroupHeader에 날짜·요일·일차(Day X)·예산합계. 헤더 클릭으로 접기. 오늘 날짜 강조.
spec_reference: 없음
uncertainty: 없음
```

```yaml
id: F-020
name: 오늘 날짜 자동 스크롤
area: 일정뷰
user_flow: /schedule 마운트 → 오늘 DateGroupHeader 탐색 → scrollIntoView(smooth)
inputs: 없음(시스템 날짜)
states: 초기화 | 스크롤완료
permissions: 로그인 필요
dependencies: useRef, useEffect
observed_behavior: 마운트 시 1회. new Date().toISOString().slice(0,10)으로 날짜 계산. 해당 그룹 있을 때만 스크롤.
spec_reference: 없음
uncertainty: 없음
```

```yaml
id: F-021
name: 일정 뷰 인라인 아이템 생성
area: 일정뷰
user_flow: 날짜 그룹 "+ 항목 추가" → 입력 → Enter/blur → POST /api/items(date 자동지정)
inputs: 이름(필수)
states: 버튼 | 입력 | 저장 | 완료
permissions: 로그인 필요
dependencies: /api/items(POST), ScheduleTable
observed_behavior: 분류='기타', trip_priority='검토필요', links=[], date=해당날짜 기본값.
spec_reference: 없음
uncertainty: 없음
```

```yaml
id: F-022
name: 일정 테이블 (데스크톱)
area: 일정뷰
user_flow: 데스크톱 일정 뷰 → min-w-[720px] 테이블 → 인라인 편집
inputs: items, 날짜그룹, 편집상태
states: 테이블 | 편집
permissions: 로그인 필요
dependencies: ScheduleTable, TableRow, 셀 컴포넌트
observed_behavior: 가로 스크롤 가능. 컬럼: 시간(w-16)/이름(min-w-[220px])/분류(w-12)/예약상태(w-28)/예산(w-24)/상세(w-8).
spec_reference: specs/012-inline-table-view
uncertainty: 없음
```

```yaml
id: F-023
name: 모바일 일정 카드
area: 일정뷰
user_flow: 모바일 일정 뷰 → MobileScheduleItemCard → 클릭 → ItemPanel
inputs: item, onOpenPanel
states: 카드 표시
permissions: 로그인 필요
dependencies: MobileScheduleItemCard, ItemPanel
observed_behavior: rounded-2xl border bg-white. 이모지+이름, 분류, 예약상태닷, 시간범위, 예산. 호버=border-gray-300+shadow. active:scale-[0.99]. 클릭=onOpenPanel(item.id).
spec_reference: 없음
uncertainty: 없음
```

```yaml
id: F-024
name: 날짜 그룹 접기/펼치기
area: 일정뷰
user_flow: DateGroupHeader 클릭 → collapsedDates 변경 → 그룹 항목 숨김/표시
inputs: date
states: 펼침 | 접힘
permissions: 로그인 필요
dependencies: ScheduleTable, DateGroupHeader
observed_behavior: collapsedDates Set에 date 추가/제거. 접힘 시 그룹 내 항목 렌더 안 함.
spec_reference: 없음
uncertainty: 없음
```

---

## 지도 (Map)

```yaml
id: F-025
name: 지도 뷰 (전체/일정)
area: 지도
user_flow: /map → ResearchMap(전체) 또는 ScheduleMap(date 있는 항목) 표시
inputs: items, mapView('all'|'schedule')
states: 로딩 | 렌더링
permissions: 로그인 필요
dependencies: ResearchMap, ScheduleMap(동적로드 ssr:false), Leaflet
observed_behavior: 풀 뷰(모바일 h-[calc(100vh-56px)]). 항목 클릭 → ItemPanel 열기.
spec_reference: 없음
uncertainty: Leaflet 마커, 클러스터, 인포윈도우 세부 동작 미확인 (ssr:false 동적로드).
```

```yaml
id: F-026
name: 지도 전체/일정 토글
area: 지도
user_flow: /map 상단 토글 → "전체" / "일정" 클릭 → mapView 변경
inputs: mapView
states: 전체 | 일정
permissions: 로그인 필요
dependencies: MapPageContent, useState
observed_behavior: 활성=bg-gray-900 text-white, 비활성=text-gray-500.
spec_reference: 없음
uncertainty: 없음
```

---

## Google Maps 임포트 (GmapsImport)

```yaml
id: F-027
name: GmapsImport URL 입력
area: GmapsImport
user_flow: /gmaps-import → URL 입력 → 제출 → POST /api/gmaps/preview
inputs: 구글맵 리스트 URL
states: 입력대기 | 제출중 | 성공 | 실패
permissions: 로그인 필요
dependencies: /api/gmaps/preview(POST)
observed_behavior: 제출 중 버튼 disabled. 성공 시 candidates 배열 반환 + state='review'.
spec_reference: specs/006-gmaps-import
uncertainty: URL 형식 검증 기준 불명확.
```

```yaml
id: F-028
name: 임포트 후보 검토
area: GmapsImport
user_flow: state='review' → CandidateList → 체크박스 선택/해제 → 카테고리 오버라이드 → "가져오기"
inputs: candidates(place/status/similarItem/selected/mappedCategory)
states: 검토 | 선택중
permissions: 로그인 필요
dependencies: /api/gmaps/import(POST), CandidateList
observed_behavior: 상태배지: new=초록, similar=황색, duplicate=회색. 체크박스로 selected 토글. 카테고리 드롭다운. 선택된 후보 있을 때만 "가져오기" 활성.
spec_reference: specs/006-gmaps-import
uncertainty: new/similar/duplicate 판정 로직 미확인.
```

```yaml
id: F-029
name: 임포트 실행
area: GmapsImport
user_flow: "가져오기" → state='importing' → POST /api/gmaps/import → state='done' → /research?imported=...
inputs: selected candidates
states: 임포트중 | 완료
permissions: 로그인 필요
dependencies: /api/gmaps/import(POST), useRouter
observed_behavior: 임포트중 UI 비활성. {inserted, ids} 응답. done 후 /research?imported=ids 리다이렉트.
spec_reference: specs/006-gmaps-import
uncertainty: 없음
```

```yaml
id: F-030
name: 임포트 완료
area: GmapsImport
user_flow: state='done' → 완료 메시지 → 2초 후 /research 자동 리다이렉트
inputs: insertedCount, insertedIds
states: 완료 | 리다이렉트중
permissions: 로그인 필요
dependencies: useRouter, useEffect
observed_behavior: '○개 장소가 추가되었습니다.'. useEffect에서 state='done' 감지 후 router.push.
spec_reference: 없음
uncertainty: 없음
```

---

## 항목 패널 (ItemPanel)

```yaml
id: F-031
name: 항목 패널 (모달/사이드패널)
area: 항목상세
user_flow: 항목 선택 → ?item=id URL 파라미터 → ItemPanel 열기
inputs: item, isOpen, onClose, onSave, onDelete
states: 닫힘 | 열림(보기) | 열림(편집) | 변경사항확인
permissions: 로그인 필요
dependencies: ItemDetailView, PanelItemForm, createPortal
observed_behavior: 모바일=바텀시트(h-[80vh], rounded-t-2xl, translateY). 데스크톱=사이드패널(w-[520px], translateX). Esc=닫기. 터치 드래그 down 50px=닫기. 배경클릭=닫기. visualViewport로 키보드 높이 감지.
spec_reference: 없음
uncertainty: 없음
```

```yaml
id: F-032
name: 항목 상세 보기 (인라인 편집)
area: 항목상세
user_flow: ItemPanel(view) → 필드 클릭 → 인라인 편집 → Enter/blur → 저장
inputs: item, openField, savingField
states: 보기 | 편집중 | 저장중
permissions: 로그인 필요
dependencies: ItemDetailView, MetadataDropdownChip
observed_behavior: 분류/우선순위/예약상태는 MetadataDropdownChip Portal 드롭다운. 선택 즉시 onQuickUpdate. 다른 필드는 Enter/blur로 저장.
spec_reference: 없음
uncertainty: 없음
```

```yaml
id: F-033
name: 항목 패널 편집 모드
area: 항목상세
user_flow: '편집' 버튼 → PanelItemForm 렌더 → 수정 → 저장/취소
inputs: item, onSave, onCancel
states: 편집 | 저장 | 변경사항감지
permissions: 로그인 필요
dependencies: PanelItemForm
observed_behavior: 변경사항 감지 시 onDirtyChange(true). 저장 시 PUT /api/items/[id] + onSave(). 취소 시 onCancel()로 view 복귀.
spec_reference: 없음
uncertainty: 없음
```

```yaml
id: F-034
name: 항목 패널 삭제
area: 항목상세
user_flow: 패널 헤더 "삭제" 버튼(view 모드) → confirm → DELETE /api/items/[id] → 패널 닫힘
inputs: item.id
states: 버튼 | 확인대기 | 삭제 | 완료
permissions: 로그인 필요
dependencies: /api/items/[id](DELETE), useItems
observed_behavior: view 모드에서만 노출. confirm() 후 deleteItem(id) 호출 + onDelete(id).
spec_reference: 없음
uncertainty: 없음
```

---

## API 엔드포인트

```yaml
id: F-035
name: 아이템 CRUD API
area: 캐싱
user_flow: GET/POST/PUT/DELETE /api/items → Supabase 연동
inputs: 요청별 파라미터
states: 성공 | 실패 | 인증오류
permissions: 로그인 필요(미들웨어)
dependencies: Supabase, lib/data.ts
observed_behavior: GET=전체 목록, POST=생성, PUT=수정(id 파라미터), DELETE=삭제.
spec_reference: 없음
uncertainty: 없음
```

```yaml
id: F-036
name: 지오코딩 API
area: 캐싱
user_flow: GET /api/geocode?q=주소 → 좌표 반환
inputs: q(주소 문자열)
states: 성공({lat,lng}) | 실패(null) | 에러(500)
permissions: 로그인 필요
dependencies: lib/geocode.ts, 외부 지오코딩 서비스
observed_behavior: q 없으면 400. 성공 {lat,lng} 또는 {lat:null,lng:null}. 에러 500.
spec_reference: 없음
uncertainty: 외부 서비스(Nominatim?) 구현 미확인.
```

---

## 네비게이션

```yaml
id: F-037
name: 모바일 바텀 네비게이션
area: 네비게이션
user_flow: 모든 보호 페이지 → Navigation → 모바일 하단 바(목록/지도)
inputs: pathname
states: 목록활성 | 지도활성
permissions: 로그인 필요
dependencies: Navigation(Layout), usePathname, Link
observed_behavior: fixed 바텀바(md:hidden). safe-area-inset-bottom. 활성=text-gray-900, 비활성=text-gray-400.
spec_reference: specs/014-nav-ux-overhaul
uncertainty: 없음
```

```yaml
id: F-038
name: 데스크톱 사이드바
area: 네비게이션
user_flow: md 이상 → fixed left-0 사이드바 → 메인 nav(목록/지도) + 보조 nav(지도연동/로그아웃)
inputs: pathname
states: 목록활성 | 지도활성
permissions: 로그인 필요
dependencies: Navigation, useRouter
observed_behavior: w-44 사이드바. 헤더(NYC Trip, 2026년 7월). 활성 링크=bg-gray-900 text-white. 메인 콘텐츠 md:pl-44.
spec_reference: specs/014-nav-ux-overhaul
uncertainty: 없음
```

```yaml
id: F-039
name: 뷰 토글 (목록↔일정)
area: 리서치뷰
user_flow: /research 헤더 → ViewToggle → 목록/일정 클릭 → 뷰 전환
inputs: view('items'|'schedule')
states: 목록뷰 | 일정뷰
permissions: 로그인 필요
dependencies: ViewToggle, ItemList, ScheduleTable
observed_behavior: view='items'일 때만 검색/필터 도구모음 표시.
spec_reference: 없음
uncertainty: 없음
```

---

## 데이터 & 훅

```yaml
id: F-040
name: useItems 훅 (데이터 관리)
area: 캐싱
user_flow: 컴포넌트 마운트 → useItems() → GET /api/items → items + 제어함수 제공
inputs: 없음
states: 로딩 | 완료 | 에러
permissions: 로그인 필요
dependencies: /api/items(GET/POST/PUT/DELETE)
observed_behavior: items, isLoading, error, createItem, updateItem, deleteItem 제공. 마운트 시 초기 로드.
spec_reference: specs/005-data-caching-fast-ux
uncertainty: 상태 업데이트가 optimistic인지 서버대기인지 불명확.
```

---

## UI 컴포넌트

```yaml
id: F-041
name: 로딩 스켈레톤
area: 네비게이션
user_flow: isLoading=true → 플레이스홀더 5개 표시 → 완료 시 실제 데이터로 대체
inputs: 없음
states: 로딩표시
permissions: 로그인 필요
dependencies: ItemCardSkeleton, ResearchTableSkeleton
observed_behavior: gray-200 배경 플레이스홀더.
spec_reference: 없음
uncertainty: 없음
```

```yaml
id: F-042
name: FAB (Floating Action Button)
area: 네비게이션
user_flow: 모바일 목록 뷰 하단 우측 "+ 추가" → /items/new
inputs: 없음
states: 버튼표시
permissions: 로그인 필요
dependencies: FAB, Link
observed_behavior: 모바일만(md:hidden). pb-28으로 바텀 네비 위에 위치.
spec_reference: 없음
uncertainty: 없음
```

---

## 기능 ID 요약 (42개)

| 영역 | IDs |
|---|---|
| 인증 | F-001~003 |
| 항목 관리 | F-004~010 |
| 리서치 뷰 | F-011~018 |
| 일정 뷰 | F-019~024 |
| 지도 | F-025~026 |
| GmapsImport | F-027~030 |
| 항목 패널 | F-031~034 |
| API | F-035~036 |
| 네비게이션 | F-037~039 |
| 데이터 & 훅 | F-040 |
| UI 컴포넌트 | F-041~042 |

## 불확실 영역 Top 3

1. **GmapsImport 상태 판정** (F-027~029) — new/similar/duplicate 판정 알고리즘, URL 형식 검증 기준 미확인
2. **useItems 상태 업데이트 타이밍** (F-040) — optimistic vs 서버대기 불명확. race condition 처리 수준 미확인
3. **지도 컴포넌트** (F-025) — Leaflet 마커·클러스터·인포윈도우 세부 동작 (ssr:false 동적로드로 정적 분석 제한)
