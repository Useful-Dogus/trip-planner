# Feature Specification: README 및 프로젝트 문서 추가

**Feature Branch**: `010-add-readme-docs`
**Created**: 2026-04-06
**Status**: Draft
**Input**: User description: "issue #37: README 및 프로젝트 문서 추가 — 현재 프로젝트에 README.md가 없음. 저장소에 처음 방문하면 프로젝트가 무엇인지 알 수 없음."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 저장소 방문자가 프로젝트 파악 (Priority: P1)

저장소에 처음 방문한 사람(협업자, 미래의 자신)이 README.md를 읽고 이 프로젝트가 무엇인지, 어떻게 로컬에서 실행하는지 이해한다.

**Why this priority**: README가 없으면 저장소의 첫인상이 완전히 없는 것과 마찬가지다. 이것 하나만 있어도 즉각적인 가치를 제공한다.

**Independent Test**: README.md 파일을 GitHub에서 열어 프로젝트 소개, 기술 스택, 실행 방법, 환경 변수 섹션이 모두 존재하는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 저장소 루트에 README.md가 없는 상태에서, **When** README.md를 작성하면, **Then** GitHub 저장소 첫 페이지에 프로젝트 소개가 렌더링된다.
2. **Given** README.md가 존재할 때, **When** 방문자가 "로컬 실행 방법" 섹션을 따라 명령을 실행하면, **Then** 개발 서버가 정상 기동된다.
3. **Given** README.md가 존재할 때, **When** 방문자가 환경 변수 섹션을 읽으면, **Then** 어떤 변수가 필요하고 어디서 얻는지 알 수 있다.

---

### User Story 2 - 환경 변수 설정 가이드 확인 (Priority: P2)

새로 프로젝트를 클론한 사람이 `.env.example` 파일과 README의 환경 변수 섹션을 참고해 `.env.local` 파일을 올바르게 작성한다.

**Why this priority**: 환경 변수 설정 실패는 가장 흔한 "처음 실행" 장애물이다. 명확한 가이드가 있으면 진입 장벽을 낮출 수 있다.

**Independent Test**: README의 환경 변수 섹션만 읽고 `.env.local` 파일을 작성할 수 있는지 확인한다.

**Acceptance Scenarios**:

1. **Given** `.env.example`과 README가 존재할 때, **When** 방문자가 각 변수 설명을 읽으면, **Then** 변수의 목적과 값을 얻는 방법(Supabase 대시보드 위치 등)을 이해한다.

---

### Edge Cases

- README의 실행 방법 명령이 실제 package.json의 스크립트와 다를 경우 오류 발생 → 항상 실제 명령과 동기화한다.
- 환경 변수 목록이 `.env.example`과 README 간에 불일치할 경우 혼란 발생 → 두 파일을 항상 일치시킨다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 저장소 루트에 `README.md` 파일이 존재해야 한다.
- **FR-002**: README에는 프로젝트 한 줄 소개(무엇을 위한 앱인지)가 포함되어야 한다.
- **FR-003**: README에는 주요 기능 요약(최소 3개 이상)이 포함되어야 한다.
- **FR-004**: README에는 로컬 실행 방법(`npm install` + `npm run dev`)이 단계별로 포함되어야 한다.
- **FR-005**: README에는 필요한 환경 변수 목록과 각 변수의 설명 및 값 취득 방법이 포함되어야 한다.
- **FR-006**: README에는 사용된 기술 스택(Next.js, React, Supabase, Tailwind CSS 등)이 간략히 정리되어야 한다.
- **FR-007**: `.env.example` 파일이 루트에 존재하고 README의 환경 변수 목록과 일치해야 한다.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 저장소 루트에 README.md가 존재하고, GitHub에서 렌더링 시 모든 섹션(소개, 기능, 실행 방법, 환경 변수, 기술 스택)이 정상 표시된다.
- **SC-002**: README의 실행 방법을 따라 명령을 입력하면 개발 서버가 오류 없이 기동된다.
- **SC-003**: README의 환경 변수 섹션과 `.env.example` 파일의 변수 목록이 100% 일치한다.
- **SC-004**: 프로젝트를 처음 보는 사람이 README만 읽고 5분 이내에 로컬 실행 환경을 구성할 수 있다.

## Assumptions

- 이 프로젝트는 개인(2인) 사용 목적의 여행 플래너 앱으로, README는 간결하고 실용적인 수준이면 충분하다.
- 별도의 기여 가이드(CONTRIBUTING.md) 또는 라이선스 파일은 이 이슈의 범위에 포함되지 않는다.
- `.env.example` 파일이 이미 존재하므로, 해당 파일의 변수를 기반으로 README를 작성한다.
