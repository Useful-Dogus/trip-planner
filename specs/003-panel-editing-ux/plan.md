# Implementation Plan: 패널 기반의 끊김 없는 편집 경험

**Branch**: `003-panel-editing-ux` | **Date**: 2026-03-25 | **Spec**: [spec.md](./spec.md)

## Summary

리서치 리스트에서 항목 클릭 시 전체 화면 전환 없이 패널(데스크탑: 사이드 패널 / 모바일: 바텀 시트)에서 상세 정보 확인 및 인라인 편집이 가능하도록 한다. ResearchPage에 선택 상태 관리를 추가하고, ItemPanel 컴포넌트를 신규 작성하며, ItemCard/ItemList 인터페이스를 확장한다.

## Technical Context

**Language/Version**: TypeScript 5.x + Node.js 18+
**Primary Dependencies**: Next.js 14+ (App Router), Tailwind CSS 3.x, React 18
**Storage**: 기존 파일 기반 (`data/items.json`) - 변경 없음
**Testing**: 수동 브라우저 테스트 (프로젝트에 자동화 테스트 없음)
**Target Platform**: Web (데스크탑 Chrome/Safari, 모바일 Safari/Chrome)
**Project Type**: Web application (Next.js full-stack)
**Performance Goals**: 패널 열림 애니메이션 300ms 이내
**Constraints**: 추가 외부 라이브러리 없이 구현, 기존 `/items/[id]` URL 직접 접근 유지

## Constitution Check

프로젝트 constitution이 템플릿 상태이므로 일반 원칙 적용:
- 기존 코드 스타일(Tailwind CSS, 'use client', hooks) 준수 ✓
- 외부 의존성 최소화 ✓
- 기존 API 인터페이스 변경 없음 ✓

## Project Structure

### Documentation (this feature)

```text
specs/003-panel-editing-ux/
├── plan.md          ← 이 파일
├── spec.md
├── research.md
├── data-model.md
└── tasks.md         (speckit.tasks 출력)
```

### Source Code (변경 대상)

```text
components/
├── Items/
│   ├── ItemCard.tsx     # onSelect/isActive prop 추가
│   └── ItemList.tsx     # selectedItemId/onSelectItem prop 추가
└── Panel/
    ├── ItemPanel.tsx    # 신규: SidePanel + BottomSheet 통합 패널
    └── PanelItemForm.tsx # 신규: 패널 전용 편집 폼 (콜백 기반)

app/
└── research/
    └── page.tsx         # selectedItemId 상태 추가, ItemPanel 렌더링
```

## Subtask Breakdown (3개 커밋 대응)

### Subtask 1: 패널/시트 UI 인프라

`components/Panel/ItemPanel.tsx` 신규 작성:
- 데스크탑: `fixed right-0 top-0 h-full w-[420px]` 사이드 패널
- 모바일: `fixed bottom-0 left-0 right-0 max-h-[85vh]` 바텀 시트
- CSS transition `translate-x-full` / `translate-y-full` → `translate-x-0` / `translate-y-0`
- 반투명 백드롭 + 클릭으로 닫기
- ESC 키 닫기 (`useEffect` + `keydown`)
- 스와이프 다운 닫기 (`touchstart`/`touchmove`/`touchend`)
- 닫기 버튼 (×)

**이 단계에서는 패널 내 콘텐츠를 placeholder로 두어도 됨**

### Subtask 2: 인라인 상세보기/편집 통합

`components/Panel/PanelItemForm.tsx` 신규 작성:
- 기존 `ItemForm` 로직 기반, `router.push` 대신 `onSave(item)` / `onDelete(id)` 콜백
- view 모드: 기존 `/items/[id]` 페이지 내용을 인라인 렌더링
- edit 모드: 편집 폼 인라인 렌더링
- 모드 전환: '편집' 버튼으로 view → edit, '취소' 버튼으로 edit → view

`app/research/page.tsx` 수정:
- `selectedItemId: string | null` 상태 추가
- `ItemPanel` 렌더링 추가
- `onSave`: `setItems(prev => prev.map(i => i.id === updated.id ? updated : i))`
- `onDelete`: `setItems(prev => prev.filter(i => i.id !== id))` + `setSelectedItemId(null)`

`components/Items/ItemList.tsx` / `ItemCard.tsx` 수정:
- `onSelectItem`, `selectedItemId` prop 추가
- `ItemCard`의 `<Link>` 를 `<div onClick>` 로 교체 (Link는 보조 접근성용 유지)

### Subtask 3: 활성 상태 및 애니메이션 Polish

`ItemCard`:
- `isActive` prop에 따라 `ring-2 ring-gray-900 bg-gray-50` 등 Active State 스타일 적용

`ItemPanel`:
- 패널 열림/닫힘 animation CSS transition 확인 및 튜닝
- 다른 카드 클릭 시 패널 내용 교체 (슬라이드 없이 content fade or 즉시 교체)
- 필터 변경으로 선택 항목이 사라졌을 때 패널 닫기 처리

