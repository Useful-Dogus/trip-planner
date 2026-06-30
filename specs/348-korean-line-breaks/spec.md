# Feature Specification: Korean Copy Line Break Quality

**Feature Branch**: `codex/348-korean-line-breaks`  
**Created**: 2026-06-30  
**Status**: Draft  
**Input**: GitHub issue #348 - 한국어 문장 줄바꿈 품질 점검

## User Scenarios & Testing

### User Story 1 - 빈 상태 설명을 자연스럽게 읽는다 (Priority: P1)

한국어 빈 상태와 온보딩성 설명 문구를 읽는 사용자는 조사나 어미 한 글자만 다음 줄에 떨어지는 어색한 줄바꿈을 보지 않아야 한다.

**Why this priority**: 빈 상태는 사용자가 다음 행동을 결정하는 첫 안내 표면이므로, 문장이 끊기면 제품 신뢰와 가독성이 떨어진다.

**Independent Test**: 대시보드 빈 상태의 “가 보고 싶은 곳을 모으면, 여기서 하루 단위 일정으로 정리할 수 있어요.” 문구와 주요 EmptyState 문구를 모바일/데스크톱 폭에서 확인한다.

**Acceptance Scenarios**:

1. **Given** 대시보드에 여행이 없을 때, **When** 사용자가 빈 상태 설명을 보면, **Then** “있어요” 같은 어미가 한 글자 단독 줄로 쪼개지지 않는다.
2. **Given** 목록, 지도, 일정, 공유 등 공통 EmptyState가 표시될 때, **When** 화면 폭이 달라지면, **Then** 한국어 제목과 설명은 단어/어절 중심으로 줄바꿈된다.

### Edge Cases

- 긴 URL이나 영문 토큰이 포함되면 컨테이너를 넘치지 않고 필요한 경우에만 단어 내부에서 줄바꿈되어야 한다.
- inline 크기의 EmptyState도 같은 줄바꿈 정책을 따라야 한다.

## Requirements

### Functional Requirements

- **FR-001**: 공통 EmptyState 제목과 설명은 한국어에 적합한 줄바꿈 정책을 사용해야 한다.
- **FR-002**: EmptyState 설명 영역은 주요 한국어 안내 문구가 과도하게 좁은 폭에서 강제로 쪼개지지 않도록 적정 최대 폭을 가져야 한다.
- **FR-003**: 줄바꿈 정책은 재사용 가능한 기준으로 남아야 한다.
- **FR-004**: 긴 비한국어 토큰이 있을 때 레이아웃 overflow를 만들면 안 된다.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `components/UI/EmptyState.tsx`를 사용하는 주요 빈 상태가 같은 한국어 줄바꿈 정책을 공유한다.
- **SC-002**: 디자인 가이드의 EmptyState 규칙에 한국어 줄바꿈 기준이 남는다.
- **SC-003**: `npm run lint`와 `npm run build`가 통과한다.
