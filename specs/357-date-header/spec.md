# Feature Specification: Schedule Date Header Hierarchy

**Feature Branch**: `codex/357-date-header`  
**Created**: 2026-06-30  
**Status**: Draft  
**Input**: GitHub issue #357 - 일정 테이블 날짜 헤더 여백과 위계 개선

## User Scenarios & Testing

### User Story 1 - 날짜 섹션을 빠르게 구분한다 (Priority: P1)

일정 뷰에서 여러 날짜가 이어질 때 사용자는 날짜 헤더를 일반 일정 행과 즉시 구분할 수 있어야 한다.

**Why this priority**: 날짜 헤더는 일정 테이블의 주요 구조 단위이며, 위계가 약하면 긴 일정에서 탐색 비용이 커진다.

**Independent Test**: 일정 뷰에서 두 개 이상의 날짜 섹션을 표시하고, 날짜 헤더가 일반 항목 행보다 여백과 텍스트 위계로 분리되어 보이는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 일정 항목이 여러 날짜에 나뉘어 있을 때, **When** 사용자가 일정 테이블을 스캔하면, **Then** 각 날짜 헤더가 섹션 시작점으로 명확히 인지된다.
2. **Given** 날짜 헤더에 예산, 숙소, 오늘 배지가 함께 표시될 때, **When** 화면 폭이 줄어들면, **Then** 날짜 라벨의 위계가 유지되고 보조 정보가 헤더를 압도하지 않는다.

### Edge Cases

- 날짜 미정 그룹도 같은 섹션 헤더 리듬을 사용해야 한다.
- 드래그 중 drop target 상태에서도 헤더 경계와 위계가 유지되어야 한다.

## Requirements

### Functional Requirements

- **FR-001**: 날짜 헤더는 일반 일정 행보다 큰 텍스트 위계와 충분한 상하 여백을 가져야 한다.
- **FR-002**: 날짜 헤더는 인접 날짜 섹션과 구분되는 경계선을 가져야 한다.
- **FR-003**: 오늘 배지, D+n, 숙소, 예산, 추가 버튼은 날짜 라벨의 주 위계를 훼손하지 않아야 한다.
- **FR-004**: 날짜 헤더 스타일은 기존 디자인 토큰과 4px spacing 체계를 사용해야 한다.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 날짜 헤더의 기본 텍스트 크기가 일반 메타 텍스트보다 한 단계 이상 크다.
- **SC-002**: 날짜 헤더의 수직 padding은 16px 단위 리듬을 사용한다.
- **SC-003**: `npm run lint`와 `npm run build`가 통과한다.
