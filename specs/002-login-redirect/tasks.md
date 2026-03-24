# Tasks: 이미 로그인된 경우 /login 리다이렉트

**Input**: Design documents from `/specs/002-login-redirect/`
**Prerequisites**: plan.md, spec.md, research.md

**참고**: research.md 분석 결과, `app/login/page.tsx`에 이미 구현 완료되어 있음. 추가 구현 불필요.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: 기존 구현 확인

**Purpose**: 이미 구현된 코드가 요구사항을 올바르게 충족하는지 검증

- [x] T001 [US1] `app/login/page.tsx`에서 리다이렉트 로직 동작 확인 - 유효 토큰 시 `/research` 리다이렉트, 미인증 시 로그인 폼 표시
- [x] T002 [US1] `lib/auth.ts`의 `verifyToken`이 만료/위변조 토큰에 대해 `false` 반환하는지 확인

**Checkpoint**: 기존 구현이 FR-001, FR-002, FR-003을 모두 충족함을 확인

---

## Phase 2: 이슈 종료

**Purpose**: GitHub 이슈 #10 닫기

- [ ] T003 spec, plan, research, tasks 파일을 git에 커밋
- [ ] T004 PR 생성하여 issue #10 close

---

## Dependencies & Execution Order

- T001, T002: 병렬 실행 가능 (각기 다른 파일 검증)
- T003: T001, T002 완료 후
- T004: T003 완료 후

---

## Implementation Strategy

구현 불필요. 기존 코드 확인 후 PR 생성으로 이슈를 닫는다.
