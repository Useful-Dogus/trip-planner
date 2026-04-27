# Full QA 캠페인 Charter — trip-planner / 2026-04-full-pass

> 한 번의 캠페인으로 trip-planner의 모든 기능을 훑어 결함을 제거하고, 한 closeout 보고서로 종결한다.
> AI 4 역할(기능 조사·결함 조사·결함 수정·리포트), 사람은 트리아지 게이트만 책임진다.

## 0. 캠페인 메타

- **프로젝트**: trip-planner (개인용 여행 리서치·일정 통합 플래너)
- **캠페인 ID**: `2026-04-full-pass`
- **시작일**: 2026-04-27
- **목표 종료일**: 2026-05-11 (약 2주)
- **베이스 브랜치**: `main` (커밋 `774a86e` 기준)
- **테스트 환경**:
  - 로컬: `npm run dev` → http://localhost:3000
  - DB: Supabase (테스트 환경 연동, 실 데이터 — 사용자가 별도 백업 보유)
  - 데이터 정책: **가급적 데이터를 보존하며 QA**한다. 다만 데이터가 날아가도 캠페인 차단 사유는 아님 (백업으로 복원 가능).
  - 인증: `AUTH_ID` / `AUTH_PASSWORD` / `JWT_SECRET` (`.env.local`)
- **타겟 디바이스**:
  - Desktop: 1440px 이상 (MacBook Safari·Chrome)
  - Mobile: iPhone Safari (375-430px), 가로/세로
- **AI 모델 운용**: 각 역할은 별도 세션. Fixer ↔ 2차 점검은 컨텍스트가 다른 세션이어야 한다. 모델은 역할·작업 난이도에 따라 자동 선택 — §9 가이드.

## 1. 스코프

### 인 스코프 (모두 검증)

| 영역 | 표면 | 비고 |
|---|---|---|
| **인증** | 로그인 폼, JWT 미들웨어, 만료/리다이렉트 | `app/login`, `middleware.ts`, `app/api/auth` |
| **항목 관리** | CRUD, 카테고리/우선순위/예약 상태 배지, 메모 | `app/items`, `components/Items/*`, `app/api/items` |
| **리서치 뷰** | 후보 항목 리스트 + 지도, 핀 클릭 ↔ 리스트 동기 | `app/research`, `components/Research`, `components/Map/ResearchMap.tsx` |
| **일정 뷰** | 날짜별 그룹·시간순 정렬, 시작/종료 시간, 인라인 편집, 모바일 카드 | `app/schedule`, `components/Schedule/*` |
| **지도** | Leaflet 핀, 카테고리 색상, 줌·팬, 모바일 제스처 | `components/Map/*` |
| **검색·필터** | 이름/주소/메모 검색(fuse.js), 모바일 바텀시트 필터, 정렬 | 014/079/013 스펙 영역 |
| **Google Maps Import** | 저장 장소 일괄 임포트, `google_place_id` 중복 검사 | `app/gmaps-import`, `app/api/gmaps`, `app/api/geocode` |
| **네비게이션** | 탭 구조, 기기별 뷰 전환, URL 보존 | 014 스펙 |
| **데이터 캐싱** | SWR 캐시·재검증, localStorage 캐시 | 005 스펙 |
| **체인 그룹핑** | 같은 그룹 항목 묶음 표시 | 011 스펙 |

### 아웃 스코프

- 다중 사용자/다중 여행 지원 (메모리 노트: 2026-07 이후 별도 트랙)
- 새 기능 추가, 디자인 리뉴얼
- Supabase 스키마 마이그레이션 (단, 결함 수정에 필수 시 별도 PR로 분리)
- 대용량(1000+ 항목) 부하 테스트 — 본 캠페인은 100 항목 규모까지만 검증
- E2E 자동화 도입 — closeout의 "다음 트랙 입력"으로 시드만 남김

## 2. 검증 차원 (Discovery 매트릭스 축)

각 `F-XXX` × 차원 셀에서 최소 1회 결함 시도.

1. **기능 정확성** — 명세대로 동작하는가
2. **반응형/뷰포트** — 데스크톱 ↔ 모바일 (375 / 768 / 1440px), 가로 회전
3. **상태/엣지** — 빈 상태, 단일 항목, 대량(50+), 잘못된 입력, 좌표 미존재
4. **데이터 정합성** — 새로고침 후 일치, SWR 재검증, 동시 편집, 캐시 stale
5. **인증·권한** — 비로그인 접근, JWT 만료, 라우트 가드
6. **네트워크 실패** — Supabase 오프라인, 5xx, 느린 응답
7. **상호작용** — 키보드 탐색, 포커스 트랩, 터치 제스처, 드래그
8. **i18n/문구** — 한국어 라벨 일관성, 시간대(KST), 날짜 포맷
9. **접근성** — 라벨, role, 색 대비 (스폿 체크 — 깊게 X)
10. **성능 체감** — 초기 로드, 지도 렌더, 대량 항목 스크롤 (계측 도구 X, 체감만)

## 3. 종료 조건

### 단계별 게이트

- **AI ① 기능 조사 종료** — `features.md`에 화면 트리의 80% 이상 등재 + 마지막 1세션 동안 신규 기능 0건.
- **AI ② 결함 조사 종료** — (기능 × 차원) 매트릭스의 80% 이상 셀에 1회 이상 시도 기록 + 마지막 1세션 동안 새 critical 0건 + 새 major ≤2건.
- **사람 트리아지 종료** — 모든 BUG-ID에 라벨 부여, cluster 확정, fix-now 캡 준수.
- **AI ③ 결함 수정 종료** — fix-now 100% PR 작성·머지·verification(2회 fail은 reopen 후 재트리아지로 반환).
- **AI ④ 리포트 종료** — `closeout.md` 5섹션 완성, `improvements.md`/`known-issues.md` 정리.

### Fix-now 라벨링 — 캠페인 핵심 가치: "제품 사용 체감 개선"

수치 캡 대신 **체감 영향**으로 트리아지한다. 각 BUG에 아래 3축을 1-3 점수로 매겨 합산.

| 축 | 1점 | 2점 | 3점 |
|---|---|---|---|
| **마주칠 빈도** | 특정 조건에서 가끔 | 자주 쓰는 화면에서 종종 | 핵심 플로우에서 매번 |
| **마주쳤을 때 짜증** | 알아채기 힘듦 / 작은 위화감 | 흐름이 끊김 / 다시 입력 | 데이터 손실 / 오해 / 막힘 |
| **우회 난이도** | 무의식적으로 우회 가능 | 의식해야 우회 가능 | 우회 방법 없음 |

- **합 7-9** → `fix-now` (체감을 분명히 흐리는 결함)
- **합 5-6** → `fix-now` 후보, cluster에 묶이면 같이 처리. 단독이면 `accept` 가능.
- **합 3-4** → `accept` (known-issue로 기록) 또는 `out-of-scope`.

수치는 트리아지 단계 가이드일 뿐 절대 캡은 아님 — 사용자 체감을 흐리는 결함은 수가 많아도 처리한다. 반대로 점수가 높아도 캠페인 스코프 밖이면 `out-of-scope`.

## 4. 디렉터리 / 산출물

```
.qa/2026-04-full-pass/
├── charter.md           # ← 이 파일
├── features.md          # AI ①
├── discovery.md         # AI ② (append-only)
├── triage.md            # 사람 게이트
├── fixes/               # AI ③
│   ├── BUG-XXX.md
│   └── cluster-Cn.md
├── known-issues.md      # accept 라벨 모음
├── improvements.md      # 캠페인 외부로 분리한 구조 개선 후보
└── closeout.md          # AI ④
```

## 5. 4 역할 실행 가이드

### 역할 ① 기능 조사 (Feature Investigator)

**세션 부팅 프롬프트 (요약)**:
> 너는 trip-planner를 처음 보는 사용자다. 결함 평가는 하지 말고 동작하는 기능의 지도를 그려라. `npm run dev` 후 `/login`부터 시작해 모든 라우트(`/research`, `/items`, `/schedule`, `/gmaps-import`, `/map`)와 컴포넌트 진입점을 클릭해 본다. 각 발견 단위를 `features.md`에 템플릿대로 추가한다. 코드 읽기는 동작이 모호할 때만 보조로 쓴다.

**권한**: 읽기 전용. 수정 권한 없음. 테스트 데이터 추가는 가능(후처리에서 정리).

**출발 시드 (라우트)**:
- `/login`
- `/research` (리서치 항목 + 지도)
- `/items` (테이블, 인라인 편집, 검색·필터·정렬)
- `/schedule` (날짜 그룹, 모바일 카드, 인라인 편집)
- `/map` (전체 지도)
- `/gmaps-import` (장소 임포트)

**검증 디바이스**: 데스크톱 1440px + 모바일 에뮬 375px 두 모드 모두 훑기.

**종료 신호**: charter §3 게이트 도달 → assistant가 "Phase 1 done"을 본문에 명시하고 PR 없이 종료.

### 역할 ② 결함 조사 (Defect Investigator)

**세션 부팅 프롬프트 (요약)**:
> 입력은 `features.md`. 각 F-XXX × charter §2의 검증 차원 셀에서 최소 1회 결함을 시도한다. 발견 시 `discovery.md`에 append-only로 기록(스키마는 charter §6). 회의적으로 본다 — `confidence`를 정직하게 매기고, 같은 root cause로 묶일 후보는 `cluster_hint`에 적는다. 수정은 절대 하지 않는다.

**권한**: 읽기 전용 (코드, 앱 동작, 네트워크 패널). DB 직접 수정 금지.

**중점 시나리오 (charter §2를 trip-planner 맥락으로 구체화)**:
- **인증**: 비로그인 직접 URL 진입, JWT 만료 후 SWR 재검증, 잘못된 비밀번호 N회.
- **데이터 정합성**: 데스크톱·모바일 두 탭 동시 편집, SWR `mutate` 누락, localStorage stale 후 새로고침.
- **모바일**: 바텀시트 ↔ 드롭다운 전환, 카드 인라인 편집 후 키보드 닫힘 동작, 가로 회전, 안전영역(notch).
- **지도**: 좌표 누락 항목, 동일 좌표 핀 겹침, 지도 ↔ 리스트 선택 동기, 카테고리 색상.
- **임포트**: 동일 `google_place_id` 재임포트, 좌표 없는 입력, 지오코딩 실패.
- **테이블**: 정렬·필터·검색 조합, 인라인 편집 중 다른 행 클릭, 빈 결과 상태.
- **체인 그룹핑**: 그룹 해체·재형성, 그룹 내 일부만 시간 변경.

### 사람 게이트: 트리아지

- 입력: `discovery.md` (AI는 `label_candidate`와 한 줄 근거를 미리 제출).
- 출력: `triage.md` (라벨·cluster·root cause 가설·fix 우선순위).
- 사람 책임: 라벨 확정, cluster 머지, 캡 적용, PR 머지 승인.

### 역할 ③ 결함 수정 (Defect Fixer)

**세션 부팅 프롬프트 (요약)**:
> 입력은 `triage.md`. 각 fix-now 또는 cluster마다 `fixes/<id>.md` 노트를 먼저 작성(root cause·strategy·regression test·collateral). PR은 strategy에 따라 분리(direct / tidy_then_fix / structural). 같은 cluster 다중 BUG는 1 PR + 본문에 BUG-ID 전부 링크. PR 본문 5필수 줄 누락 금지. 머지 전 별도 컨텍스트 AI에 4질문 점검을 받아 결과를 노트에 첨부.

**권한**: 소스 수정, 회귀 테스트 추가, 마이그레이션 SQL(필요 시 supabase/), PR 생성. **머지는 사람이 한다.**

**trip-planner 특화 가드레일**:
- **Tidy 범위 제한**: cluster가 만지는 영역만. 예) `components/Schedule/cells/*`만 정리. `components/Items/*`로 번지면 `improvements.md`로 분리.
- **회귀 테스트 부재**: 현재 자동화 스위트가 없으므로, 회귀는 (a) 재현 시나리오를 `fixes/<id>.md`에 절차로 적고 (b) 가능하면 단위/통합 테스트의 첫 케이스를 추가한다 — 그 자체가 closeout의 "자동화 시드".
- **Supabase 스키마 변경**: 동작 변경 PR과 분리. 구조 PR은 변경 전후 동일 reproduction이 깨지지 않음을 입증.
- **모바일 회귀**: 모든 fix는 데스크톱 + 모바일 에뮬 둘 다에서 통과해야 verification `pass`.
- **차단 사유 외 hotfix 금지**: 수정 중 신규 발견 → `discovery.md`에 append.

**머지 직전 2차 점검 4질문** (별도 세션에 PR diff + BUG 노트 + fix 노트 전달):
1. root cause가 증상이 아닌 원인 수준인가?
2. 회귀 시나리오/테스트가 BUG를 실제로 재현하는가?
3. Strategy가 적절한가? (`direct`로 충분한데 부풀거나, 반대로 `direct`로 덮어 root cause가 남지 않았는가?)
4. 구조 변경 PR이 동작 변경을 포함하지 않았는가?

**검증 절차** (각 머지 fix별):
- BUG의 reproduction 그대로 재실행 → `pass`/`fail`/`blocked` 기록.
- cluster의 인접 화면 1-2개 sanity check (예: schedule cluster면 research 뷰도 확인).
- 핵심 happy path 1회 통주행: 로그인 → 항목 추가 → 일정 배치 → 지도 확인 → 검색.
- `fail` 1회 → `BUG-<ID>-r2`로 reopen, 1회 재진입. 2회 fail → 트리아지 반환.

### 역할 ④ 리포트 작성 (Reporter)

**세션 부팅 프롬프트 (요약)**:
> 인풋은 `features.md`, `discovery.md`, `triage.md`, `fixes/*`, 머지된 PR 목록, verification 결과. `closeout.md`를 charter §6의 5섹션 스키마로 작성한다. 숫자(발견·머지·테스트·잔여)는 산출물에서 직접 카운트. cluster별 strategy 분포(direct/tidy/structural 비율)와 root cause 패턴은 closeout의 핵심 가치이므로 빠뜨리지 말 것. before/after는 charter의 핵심 happy path 통주행 결과를 기준으로.

**권한**: 읽기 전용 + `closeout.md`/`known-issues.md`/`improvements.md` 작성.

## 6. 산출물 스키마 (4 역할 공통 템플릿)

### `features.md` 항목

```yaml
id: F-001
name: 로그인
area: 인증
user_flow: /login → 자격증명 입력 → /research 리다이렉트
inputs: AUTH_ID, AUTH_PASSWORD
states: 빈 폼, 검증 중, 실패, 성공
permissions: 비로그인 진입 가능
dependencies: app/api/auth, JWT_SECRET, middleware.ts
observed_behavior: 성공 시 토큰 쿠키, /research로 이동
spec_reference: specs/001-trip-planner-mvp/spec.md
uncertainty: 만료 시 리다이렉트 시점이 SWR 재검증과 충돌하는지 미확인
```

### `discovery.md` 항목

```yaml
id: BUG-001
feature_ref: F-007
title: 일정 카드 인라인 편집 중 다른 카드 탭하면 변경값이 사라짐
area: schedule / mobile
severity: major
confidence: confirmed
reproduction:
  - /schedule (모바일 375px)
  - 카드 A 시간 셀 탭 → 편집 모드 진입
  - 편집값 입력 (저장 안 함)
  - 카드 B의 임의 영역 탭
  - 카드 A로 돌아옴
expected: A의 편집값이 저장되어 있거나 명시적 confirm 다이얼로그
actual: A의 변경값이 사라지고 원래 값 표시
reproduction_rate: 5/5
environment: iPhone 14 Safari emul, 375x812, main@774a86e
evidence: screenshots/BUG-001/*.png
cluster_hint: 인라인 편집 dirty state 미보존 (C? — 테이블뷰 #83 fix와 같은 root cause 가능)
assumption: 편집 자동저장이 명시 스펙은 아니나 #83에서 동일 의도로 수정됨
label_candidate: fix-now (major + 빈도 높음)
```

### `triage.md` 항목

```yaml
id: BUG-001
label: fix-now
cluster: C1
cluster_root_cause: 인라인 편집 컴포넌트가 blur/외부 클릭 이벤트를 onSave로 연결하지 않고 onCancel로 처리
priority: P1
notes: BUG-004, BUG-009도 같은 cluster — 한 번에 처리
```

### `fixes/<id>.md` 항목

```yaml
summary: 인라인 편집 dirty state를 외부 클릭 시 자동 저장
root_cause: useInlineEdit 훅의 onClickOutside가 항상 cancel을 호출 — schedule cell과 table row의 #83 fix와 동일 패턴이지만 모바일 카드는 누락
fix_strategy: tidy_then_fix
change_scope:
  - tidy: components/common/useInlineEdit.ts (훅 추출)
  - fix: components/Schedule/cells/*, components/Items/* (훅 사용)
regression_test:
  - 시나리오: BUG-001/BUG-004/BUG-009 reproduction 그대로
  - 자동화 시드: __tests__/useInlineEdit.test.ts (신규)
collateral_impact: 테이블 뷰(#83)에 동일 훅 적용 — 동작 동일 확인
prs:
  - tidy: #PR-A
  - fix: #PR-B
verification:
  - BUG-001: pass (모바일·데스크톱)
  - BUG-004: pass
  - BUG-009: pass
  - happy path: pass
ai_review:
  reviewer_session: opus-4-7-fresh-context
  q1: pass — root cause는 onClickOutside 핸들러 수준
  q2: pass — 단위 테스트가 BUG-001 시나리오 재현
  q3: pass — direct는 부족, structural은 과대, tidy_then_fix가 적절
  q4: pass — tidy PR diff에 동작 변경 없음 (기존 테스트 통과)
```

## 7. 위험 / 가정

- **테스트 환경 + 백업 보유**: 데이터가 날아가도 캠페인 차단 사유는 아님. 단 가급적 보존 — 결함 조사·수정 시 "복구 불가능한 대량 삭제"는 사람 확인 후 수행.
- **자동화 부재**: 회귀 테스트는 수동 시나리오 + 신규 단위 테스트로만 보장. closeout에서 자동화 시드를 명시.
- **모바일 실기기 검증 한계**: 주로 에뮬레이터(Chrome DevTools / Safari Responsive Design) 사용. 체감 영향 7점 이상 결함은 실기기 1회 확인 권장.
- **AI ② 거짓 양성**: confidence가 hypothesis인 항목은 사람 트리아지에서 1차 필터링.
- **2차 점검 AI 동질성**: Fixer와 Reviewer가 같은 모델/프롬프트라면 review distance가 약함 → 다른 세션 + 다른 컨텍스트(diff·노트만 전달, charter 미전달). 가능하면 모델군도 다르게(§9).

## 8. AI 모델 자동 선택 가이드

각 세션을 부팅할 때 아래 표를 따른다. 작업이 시작된 뒤 난이도가 달라지면 모델을 바꾼다.

| 역할 / 작업 | 권장 모델 | 이유 |
|---|---|---|
| **AI ① 기능 조사** | Sonnet (latest) | 광범위 탐색·도구 호출 다수, 추론 깊이보다 커버리지·속도가 중요. |
| **AI ② 결함 조사 (1차 패스)** | Sonnet (latest) | 매트릭스 셀을 빠르게 훑으며 가설을 쌓는 단계. |
| **AI ② 결함 조사 (어려운 셀 / 정합성·인증·캐시)** | Opus | SWR·JWT·동시 편집처럼 상태 추론이 깊어야 하는 셀은 Opus로 승격. |
| **AI ③ 결함 수정 — direct strategy** | Sonnet (latest) | 단일 컴포넌트 수정 + 회귀 시나리오 작성 수준. |
| **AI ③ 결함 수정 — tidy_then_fix / structural** | Opus | 추출·재배치·root cause 분리 판단이 필요한 케이스. |
| **2차 점검 (4질문)** | Opus, **다른 세션** | review distance가 핵심 — Fixer가 Sonnet이었으면 점검은 반드시 Opus. Fixer가 Opus였으면 점검은 다른 컨텍스트의 Opus 또는 Sonnet. |
| **AI ④ 리포트** | Sonnet (latest) | 산출물 종합·카운트·요약은 Sonnet으로 충분. |

**휴리스틱**:
- "이 결함이 왜 일어났는지 한 줄 root cause를 못 쓰겠다" → Opus로 승격.
- "코드 한 곳만 바꾸면 끝" → Sonnet 유지.
- 토큰·속도 비용은 캠페인 가치 대비 미미하므로 의심되면 Opus.

## 9. 다음 트랙으로 흘려보낼 자산

- **자동화 시드**: `fixes/*/regression_test.자동화 시드` 항목을 모아 별도 트랙에 PR 큐로 전환.
- **회귀 영역 우선순위**: cluster별 root cause 패턴 → 가장 큰 cluster가 만진 모듈을 모니터링 1순위.
- **모니터링 시드**: `known-issues.md`의 사용자 가시 known-issue → 향후 알림/Sentry 시드.
- **`improvements.md`**: 캠페인이 손대지 않은 구조 개선 후보 → 다음 캠페인 입력 또는 별도 리팩토링 트랙.
- **`features.md`**: 살아있는 제품 명세의 1차 시드 → README/CLAUDE.md 보강 입력.
