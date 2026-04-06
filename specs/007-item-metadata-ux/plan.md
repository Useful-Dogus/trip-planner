# Implementation Plan: 아이템 메타데이터 UX 재설계

**Branch**: `007-item-metadata-ux` | **Date**: 2026-04-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/007-item-metadata-ux/spec.md`

## Summary

아이템의 메타데이터 구조를 `카테고리 / 의사결정 단계 / 예약상태 / 우선순위` 4개 축으로 재정의하고, 목록 카드와 상세 패널에서 모두 칩으로 일관되게 노출한다. 상세 패널에서는 각 칩 클릭 시 드롭다운으로 즉시 수정 가능해야 하며, 저장소와 API는 새 값 체계 및 마이그레이션 규칙을 반영한다.

## Technical Context

**Language/Version**: TypeScript 5.x + Node.js 18+  
**Primary Dependencies**: Next.js 14.2.0 (App Router), React 18.3.1, Tailwind CSS 3.x, SWR, @supabase/supabase-js  
**Storage**: Supabase `items` 테이블 (`reservation_status` 신규 컬럼 추가, 기존 값 마이그레이션 포함)  
**Testing**: `npm run lint`, `npm run build`, 수동 UI 검증  
**Target Platform**: 웹 브라우저 (모바일 우선, 데스크탑 포함)  
**Project Type**: Next.js 풀스택 웹 애플리케이션  
**Performance Goals**: 상세 패널 칩 변경은 체감상 즉시 반영, 목록 카드에서 4개 칩 렌더링 시 레이아웃 붕괴 없음  
**Constraints**: 기존 사용자 데이터와 호환되어야 하며, `null` 예약상태는 placeholder로 안전하게 표시해야 함  
**Scale/Scope**: 단일 사용자 트립 플래너, `TripItem` 메타데이터 체계 전반 교체

## Constitution Check

프로젝트 constitution 미정 상태. 기존 저장소 규칙과 구현 패턴을 따른다.

- 타입 정의는 `types/index.ts` 단일 소스 유지
- 저장소 매핑은 `lib/data.ts`
- CRUD 검증은 `app/api/items/*`
- UI 옵션 정의는 공통 모듈로 수렴
- 과거 완료 스펙 문서는 수정하지 않음

## Project Structure

### Documentation (this feature)

```text
specs/007-item-metadata-ux/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── api/items/route.ts
├── api/items/[id]/route.ts
└── research/page.tsx

components/
├── Items/
│   ├── ItemCard.tsx
│   ├── ItemForm.tsx
│   ├── ItemList.tsx
│   └── StatusDropdown.tsx
├── Panel/
│   ├── ItemPanel.tsx
│   └── PanelItemForm.tsx
└── UI/
    ├── PriorityBadge.tsx
    └── StatusBadge.tsx

lib/
├── data.ts
├── hooks/useItems.ts
└── itemOptions.ts        # 신규 공통 옵션/라벨/스타일 정의

supabase/
└── schema.sql

types/
└── index.ts
```

**Structure Decision**: 기존 CRUD 구조를 유지하면서, 옵션 체계와 라벨은 `lib/itemOptions.ts`로 모아 중복 정의를 제거한다.

## Implementation Phases

### Phase A: 데이터 모델 및 마이그레이션 기반 정리

1. `types/index.ts`에 새 `Category`, `Status`, `ReservationStatus`, `Priority` 체계 반영
2. `supabase/schema.sql`에 `reservation_status` 컬럼 추가
3. `lib/data.ts`에 `reservation_status` 읽기/쓰기 및 구값 마이그레이션 유틸 반영
4. 기존 레코드를 새 값 체계로 변환하는 마이그레이션 스크립트 또는 안전한 변환 루틴 추가

### Phase B: API 및 클라이언트 상태 계층 정리

5. `app/api/items/route.ts`, `app/api/items/[id]/route.ts` 허용값 및 `null` 처리 갱신
6. `lib/hooks/useItems.ts`에서 nullable 필드 업데이트와 optimistic update 정리
7. 공통 옵션 정의 파일 `lib/itemOptions.ts` 추가

### Phase C: 입력 UI 개편

8. `components/Items/ItemForm.tsx`, `components/Panel/PanelItemForm.tsx`에 4개 필드 반영
9. placeholder/기본값 정책을 신규 폼과 기존 편집 폼에 일치 적용
10. 필터/정렬/라벨을 `components/Items/ItemList.tsx`에 새 체계로 반영

### Phase D: 표시 및 빠른 편집 UX

11. `components/UI/StatusBadge.tsx`, `components/UI/PriorityBadge.tsx`를 공통 옵션 기반으로 전환
12. `components/Items/ItemCard.tsx`에서 4개 칩 항상 표시 + 한 줄 래핑 허용
13. `components/Panel/ItemPanel.tsx`에서 4개 칩 전체 노출 및 클릭 드롭다운 편집 구현
14. 필요 시 기존 `StatusDropdown`을 범용 메타데이터 드롭다운 패턴으로 치환 또는 제거

### Phase E: 마감 및 검증

15. 신규/기존 데이터에 대한 표시 규칙 점검
16. 빌드, 린트, 수동 UX 검증

## Key Design Decisions

### 1. `스킵` 제거

- `우선순위`에서 `스킵`은 제거한다.
- 이유: `상태 = 제외`와 의미가 중복되어 데이터 품질을 해친다.

### 2. `reservation_status`는 nullable 유지

- 저장소와 타입에서 `reservation_status`는 `null` 허용
- UI에서만 `예약 정보 없음` placeholder 칩으로 노출
- 신규 입력 기본값은 `확인 필요`

### 3. 저장소 기준 마이그레이션 수행

- 런타임 표시 보정만으로 두지 않고 기존 저장소 값도 새 체계로 실제 변환
- 단, `reservation_status`는 새 컬럼이므로 과거 데이터는 `null` 유지

### 4. 카드/패널 노출 정책

- 목록 카드: 4개 칩 모두 표시, wrap 허용
- 상세 패널: 4개 칩 모두 표시, 클릭 편집 허용

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 저장소 값 마이그레이션 포함 | 구/신 체계 혼재를 빨리 제거해야 함 | 런타임 변환만으로 두면 예외 처리 분기가 오래 남음 |
