# Implementation Plan: 일정 종료 시간 및 상세 일정 표시 개선

**Branch**: `008-item-end-time` | **Date**: 2026-04-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/008-item-end-time/spec.md`

## Summary

기존 일정 모델을 유지하면서 `time_end` 입력 및 저장 경로를 완성하고, 상세 패널/상세 페이지에서 시작 날짜, 시작 시간, 종료 날짜, 종료 시간을 각각 다른 행으로 분리해 표시한다.

## Technical Context

**Language/Version**: TypeScript 5.x + Node.js 18+  
**Primary Dependencies**: Next.js 14.2.0, React 18.3.1, Tailwind CSS 3.x, SWR, Supabase JS  
**Storage**: Supabase `items` 테이블의 기존 `time_end` 컬럼 활용  
**Testing**: `npm run lint`, `npm run build`, 수동 UI 확인  
**Target Platform**: 모바일 우선 웹, 데스크탑 포함  
**Constraints**: 기존 `TripItem` 모델 분리 없이 옵셔널 필드로 처리, 기존 데이터와 호환

## Constitution Check

프로젝트 constitution 미정 상태. 기존 저장소 규칙을 따른다.

- 타입은 `types/index.ts`를 단일 소스로 유지
- CRUD 검증은 `app/api/items/*`
- 데이터 매핑은 `lib/data.ts`
- 폼/상세 UI는 기존 컴포넌트 구조를 유지하며 필요한 범위만 수정

## Project Structure

### Documentation

```text
specs/008-item-end-time/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code

```text
app/
├── api/items/route.ts
├── api/items/[id]/route.ts
└── items/[id]/page.tsx

components/
├── Items/ItemCard.tsx
├── Items/ItemForm.tsx
├── Panel/ItemPanel.tsx
└── Panel/PanelItemForm.tsx

types/
└── index.ts
```

## Implementation Phases

### Phase A: 데이터 입력/저장 경로 완성

1. `ItemForm`과 `PanelItemForm`에 `time_end` 입력 필드 추가
2. 생성/수정 payload에 `time_end` 포함
3. API 검증에 `time_end` 형식 검증 추가

### Phase B: 상세 표시 개선

4. 상세 패널 일정 영역을 `시작 날짜 / 시작 시간 / 종료 날짜 / 종료 시간` 행 구조로 변경
5. 항목 상세 페이지도 동일한 일정 행 구조로 정리
6. 카드 보조 메타데이터 줄에서 종료 시간이 있으면 시작-종료 범위를 더 자연스럽게 보여줄지 반영

### Phase C: 검증 및 마감

7. lint/build 실행
8. 수동 확인 포인트 정리

## Key Design Decisions

### 1. 종료 날짜는 신규 필드로 만들지 않음

- 현재 요구 범위에서는 종료 날짜 저장이 아니라 종료 시각 저장이 핵심이다.
- 상세 표시의 `종료 날짜`는 기존 `date` 값을 재사용한다.

### 2. 상세 패널과 상세 페이지 라벨 구조 통일

- 두 화면이 서로 다른 라벨을 사용하면 사용자가 맥락을 다시 해석해야 한다.
- 같은 일정 정보는 같은 행 라벨로 보이게 통일한다.

### 3. 기존 일정도 그대로 지원

- `time_end`는 선택 필드로 유지한다.
- 값이 없으면 관련 행만 표시하지 않는다.
