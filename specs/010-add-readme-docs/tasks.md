# Tasks: README 및 프로젝트 문서 추가

**Input**: Design documents from `/specs/010-add-readme-docs/`
**Prerequisites**: plan.md, spec.md, research.md

**Organization**: 단일 파일 작성 작업이므로 사용자 스토리 순서대로 구성

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능
- **[Story]**: 해당 사용자 스토리

---

## Phase 1: Setup

**Purpose**: 프로젝트 현황 파악

- [x] T001 기존 `.env.example` 파일 내용 확인 (루트 경로)

---

## Phase 2: User Story 1 - 저장소 방문자가 프로젝트 파악 (Priority: P1) 🎯 MVP

**Goal**: README.md 신규 작성 — 프로젝트 소개, 주요 기능, 기술 스택, 실행 방법, 환경 변수 포함

**Independent Test**: `README.md` 파일이 루트에 존재하고 모든 필수 섹션(소개, 기능, 기술 스택, 실행 방법, 환경 변수)이 포함되어 있는지 확인

- [x] T002 [US1] `README.md` 신규 작성 — 프로젝트 한 줄 소개 섹션 작성 (루트 경로)
- [x] T003 [US1] `README.md` 주요 기능 섹션 작성 (리서치/일정 관리, 지도, 카테고리/우선순위/예약상태 배지 등)
- [x] T004 [US1] `README.md` 기술 스택 섹션 작성 (Next.js, React, Supabase, Tailwind CSS, Leaflet, SWR 등)
- [x] T005 [US1] `README.md` 로컬 실행 방법 섹션 작성 (클론 → 의존성 설치 → 환경 변수 → 실행)
- [x] T006 [US1] `README.md` 환경 변수 섹션 작성 (`.env.example` 기반 테이블 형식)

**Checkpoint**: README.md 완성 — 방문자가 프로젝트 파악 및 실행 가능

---

## Phase 3: User Story 2 - 환경 변수 설정 가이드 확인 (Priority: P2)

**Goal**: `.env.example` 파일이 README의 환경 변수 섹션과 100% 일치하는지 검증 및 필요 시 업데이트

**Independent Test**: README의 환경 변수 테이블 항목과 `.env.example` 변수 목록이 동일한지 대조

- [x] T007 [US2] README 환경 변수 섹션과 `.env.example` 일치 여부 검증 및 필요 시 수정

**Checkpoint**: 환경 변수 가이드 일관성 확보

---

## Phase 4: Polish

**Purpose**: 최종 검토

- [x] T008 README.md 전체 내용 검토 — 마크다운 렌더링, 링크, 들여쓰기, 오탈자 확인

---

## Dependencies & Execution Order

- **Phase 1 (T001)**: 즉시 시작 가능
- **Phase 2 (T002-T006)**: T001 이후 순차 실행 (모두 같은 파일 편집)
- **Phase 3 (T007)**: T006 완료 후 실행
- **Phase 4 (T008)**: 모든 단계 완료 후

### Parallel Opportunities

- T002-T006은 개념상 각각 다른 섹션이지만 동일 파일이므로 순차 실행 권장
- T007은 T006과 독립적으로 시작 가능

---

## Implementation Strategy

### MVP (User Story 1만)

1. T001: `.env.example` 확인
2. T002-T006: README.md 작성
3. **STOP and VALIDATE**: 파일 존재 및 섹션 완비 확인
4. T007-T008: 마무리

---

## Notes

- README.md는 한국어/영어 혼용 가능 — 섹션 제목은 영어, 설명은 한국어로 작성
- `.env.example`이 이미 존재하므로 새로 만들 필요 없음
- 스크린샷/이미지는 이 이슈 범위에 포함되지 않음
- CONTRIBUTING.md, LICENSE 등 추가 문서도 이 이슈 범위 밖
