# 011 — 구현 태스크

## T1. types/index.ts — is_franchise, branches, Branch 제거
- `Branch` 인터페이스 제거
- `TripItem`에서 `is_franchise?: boolean`, `branches?: Branch[]` 필드 제거

## T2. components/Items/ItemCard.tsx — 정리 + 인라인 이름 편집
- `branchesOpen` state 제거
- is_franchise/branches 렌더링 블록 제거 (헤더 배지, 펼치기 버튼, 지점 목록)
- `onUpdateItem` optional prop 추가
- 이름 span에 더블클릭 인라인 편집 구현
  - 더블클릭 → input 전환
  - Enter / blur → 저장 (값이 변경된 경우만)
  - Escape → 취소

## T3. components/Items/GroupCard.tsx — 신규
- 헤더: 카테고리 이모지, 체인명, 배지(M/N곳 or N곳), chevron
- 기본값 접힘, 헤더 클릭으로 토글
- 헤더 이름 더블클릭 → 인라인 편집 → 전체 지점 일괄 rename
- selectedItemId 소속이면 useEffect로 자동 펼침
- BranchRow 렌더링: 📍 주소, ItemMetadataChips, LinkButton, isActive 처리

## T4. components/Items/ItemList.tsx — 그룹핑 + onUpdateItem 추가
- `onUpdateItem` prop 추가
- `allGroups` useMemo: items 기반 `Map<normalizedKey, TripItem[]>` 생성
- `renderEntries` useMemo: filtered 기반 RenderEntry[] 생성 및 정렬
- 렌더링 분기: group → GroupCard, single → ItemCard
- 항목 수 레이블: 그룹 포함 총 아이템 수

## T5. app/research/page.tsx — updateItem prop 연결
- `useItems()`에서 `updateItem` 추출
- `ItemList`에 `onUpdateItem={updateItem}` 전달
