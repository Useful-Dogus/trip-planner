# Implementation Plan: 목록 뷰 필터 UI 개선 (모바일 최적화)

**Branch**: `013-filter-ui-mobile` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)

## Summary

항상 펼쳐진 필터 칩 UI를 "필터 버튼 + 바텀시트(모바일)/드롭다운(데스크탑)" 구조로 교체한다. 활성 필터는 인라인 요약 칩으로 표시하고, 정렬은 별도 버튼으로 분리한다. 필터 로직(상태·계산)은 변경 없이 표현 계층만 재구성한다.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: Next.js 14 (App Router), React 18, Tailwind CSS 3.x  
**Storage**: N/A (클라이언트 상태만 변경)  
**Testing**: `npm run build` + `npm run lint`  
**Target Platform**: Web (모바일 375px+, 데스크탑 768px+)  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: 필터 패널 열기/닫기 애니메이션 60fps 유지  
**Constraints**: 터치 타겟 44px 이상, safe-area-inset 고려  
**Scale/Scope**: 단일 컴포넌트 범위 (ItemList + 신규 UI 컴포넌트 4개)

## Constitution Check

Constitution이 정의되어 있지 않으므로 프로젝트 규칙 기반으로 검토:

- ✅ 기존 TypeScript + Tailwind 스택 내 변경
- ✅ 새 컴포넌트는 기존 패턴(`components/Research/`, `components/UI/`) 내 배치
- ✅ 외부 라이브러리 추가 없음
- ✅ API 변경 없음
- ✅ 기존 바텀시트 패턴(ItemPanel) 재활용 → 코드 일관성 유지

## Project Structure

### Documentation (this feature)

```text
specs/013-filter-ui-mobile/
├── plan.md
├── research.md
├── data-model.md
└── tasks.md   ← /speckit.tasks 에서 생성
```

### Source Code (변경 및 신규 파일)

```text
components/
├── Research/
│   ├── FilterPanel.tsx        # 신규 — 필터 옵션 UI (바텀시트/드롭다운 내용)
│   ├── FilterButton.tsx       # 신규 — 필터 트리거 버튼 + 활성 개수 배지
│   ├── SortButton.tsx         # 신규 — 정렬 트리거 버튼 + 현재 정렬 표시
│   └── ActiveFilterChips.tsx  # 신규 — 활성 필터 요약 칩 1줄 가로 스크롤
└── Items/
    └── ItemList.tsx           # 수정 — 인라인 필터 UI 제거, 신규 컴포넌트 조합
```

**Structure Decision**: `components/Research/`에 배치. 필터 기능이 현재 리서치 탭에만 사용되므로 UI/ 공용 디렉토리가 아닌 Research/ 도메인 디렉토리에 둔다. 추후 일정 탭에도 적용 시 공용으로 이동 가능.
