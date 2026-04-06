# Tasks: 일정 종료 시간 및 상세 일정 표시 개선

**Input**: Design documents from `/specs/008-item-end-time/`
**Prerequisites**: plan.md ✓, spec.md ✓

## Phase 1: Setup

- [ ] T001 `specs/008-item-end-time/spec.md`, `plan.md`, `tasks.md` 작성으로 범위 확정

## Phase 2: Foundation

- [ ] T002 `components/Items/ItemForm.tsx`에 `time_end` 필드 추가 및 생성 payload 반영
- [ ] T003 `components/Panel/PanelItemForm.tsx`에 `time_end` 필드 추가 및 수정 payload 반영
- [ ] T004 `app/api/items/route.ts`, `app/api/items/[id]/route.ts`에 `time_end` 검증 및 저장 반영

## Phase 3: Detail Display

- [ ] T005 `components/Panel/ItemPanel.tsx` 일정 섹션을 `시작 날짜 / 시작 시간 / 종료 날짜 / 종료 시간` 행 구조로 개편
- [ ] T006 `app/items/[id]/page.tsx`도 같은 일정 행 구조로 개편
- [ ] T007 `components/Items/ItemCard.tsx` 보조 일정 표시에서 종료 시간 노출 반영

## Phase 4: Validation

- [ ] T008 `npm run lint`
- [ ] T009 `npm run build`
- [ ] T010 수동 확인: 종료 시간 저장, 상세 패널 라벨 구조, 상세 페이지 라벨 구조
