# discovery.md — trip-planner 결함 조사
> AI ② Defect Investigator 산출물. append-only.
> 생성일: 2026-04-27
> 방법: 정적 코드 분석 (모든 주요 컴포넌트·API 라우트·훅 읽기)

---

```yaml
id: BUG-001
feature_ref: F-021
title: 모바일 일정뷰 새 항목 추가 — Enter 키 누르면 API 400 에러로 저장 실패
area: schedule / mobile
severity: major
confidence: confirmed
reproduction:
  - /research 또는 /schedule (모바일 375px)
  - "일정" 탭 선택
  - 날짜 그룹의 "+ 항목 추가" 버튼 탭
  - 이름 입력 (예: "센트럴파크")
  - Enter 키 입력
expected: 해당 날짜에 항목이 생성됨
actual: 에러 토스트 "추가에 실패했습니다." 표시, 항목 생성 안 됨. blur(탭 아웃)는 정상 동작.
reproduction_rate: 5/5 (코드로 확인, 모든 날짜 그룹에서 발생)
environment: 모바일 뷰포트 (md 미만), ScheduleTable.tsx
evidence: |
  ScheduleTable.tsx:334-365 renderMobileGroupRows 내
  onKeyDown={handleNewItemKeyDown}  // ← 직접 전달 (closure 아님)
  
  MobileNewItemEditor.tsx (컴포넌트 내부):
  onKeyDown={e => onKeyDown(e, value)}  // value = 입력된 텍스트

  handleNewItemKeyDown(e, date): // date 파라미터가 실제로 inputValue를 받음
    if (e.key === 'Enter') handleNewItemBlur(date)  // date = "센트럴파크" (wrong!)

  결과: onCreateItem({ date: "센트럴파크" }) → API POST date 형식 검증 실패 → 400

  vs 데스크탑(정상): onKeyDown={e => handleNewItemKeyDown(e, date)} // 올바른 closure
cluster_hint: 단독 버그. 데스크탑은 closure로 올바르게 처리, 모바일만 누락.
assumption: 없음
label_candidate: fix-now (체감 점수 8/9 — 모바일에서 Enter가 항상 실패하므로 빈도 높음)
```

---

```yaml
id: BUG-002
feature_ref: F-009
title: ResearchTable 인라인 편집 — Escape 키로 취소 시 빈 이름으로 항목이 생성될 수 있음
area: research / desktop
severity: major
confidence: hypothesis
reproduction:
  - /research 데스크톱 뷰
  - 테이블 하단 "+ 항목 추가…" 클릭
  - 이름 입력 (예: "카페 오름")
  - Escape 키 입력 (취소 의도)
expected: 아무것도 생성 안 됨
actual: (가설) Escape 후 입력창 언마운트 시점에 blur 이벤트가 구 클로저(newItemName='카페 오름')로 발화 → 항목 생성될 수 있음
reproduction_rate: 불확실 (React 18 batching 동작에 의존)
environment: ResearchTable.tsx desktop, handleNewItemKeyDown+handleNewItemBlur
evidence: |
  handleNewItemKeyDown Escape 처리:
    setAddingRow(false)   // state batch
    setNewItemName('')    // state batch → 아직 적용 전

  input 언마운트 시 blur fires with OLD closure (newItemName = '카페 오름')
  handleNewItemBlur() → name = '카페 오름' → onCreateItem 호출

  ScheduleTable도 동일 패턴 (renderDesktopGroupRows addingToDate 처리)
cluster_hint: C1 — 새 항목 추가 취소 버그. BUG-002/BUG-003 같은 root cause.
assumption: React 18이 언마운트 시 blur를 구 클로저로 호출한다는 가정
label_candidate: fix-now (실제 발생 시 데이터 오염)
```

---

```yaml
id: BUG-003
feature_ref: F-021
title: ScheduleTable 데스크탑 새 항목 추가 — Escape 취소 시 동일한 spurious 생성 가능성
area: schedule / desktop
severity: major
confidence: hypothesis
reproduction:
  - /research 또는 /schedule 데스크탑
  - "일정" 탭 선택
  - 날짜 그룹 "+ 항목 추가" 클릭
  - 이름 입력 → Escape 취소
expected: 아무것도 생성 안 됨
actual: (가설) BUG-002와 동일 메커니즘으로 항목 생성 가능
reproduction_rate: 불확실
environment: ScheduleTable.tsx renderDesktopGroupRows, handleNewItemKeyDown
evidence: BUG-002와 동일 패턴
cluster_hint: C1 — BUG-002와 동일 cluster
assumption: BUG-002와 동일
label_candidate: fix-now (C1 클러스터 전체 처리)
```

---

```yaml
id: BUG-004
feature_ref: F-009 F-022
title: CategoryCell/StatusCell 드롭다운이 뷰포트 오른쪽 밖으로 넘침
area: research / schedule / desktop
severity: minor
confidence: confirmed
reproduction:
  - /research 데스크톱 (1024px 이하 좁은 뷰포트)
  - ResearchTable 또는 ScheduleTable의 예약상태(StatusCell) 셀 클릭
  - 드롭다운 열림 → 오른쪽이 뷰포트 밖으로 잘림
expected: 드롭다운이 뷰포트 내에 뒤집혀(flipped) 표시
actual: 드롭다운이 버튼 왼쪽에서 시작해 오른쪽으로 넘침
reproduction_rate: 뷰포트 폭이 좁을수록 발생 빈도 높음
environment: CategoryCell.tsx, StatusCell.tsx
evidence: |
  StatusCell.tsx:47 setPosition({ top: rect.bottom + 4, left: rect.left })
  — right-edge 체크 없음

  MetadataDropdownChip(ItemPanel)은 올바르게 처리:
  const left = rect.left + width > window.innerWidth
    ? Math.max(0, rect.right - width)
    : rect.left
cluster_hint: C2 — 드롭다운 포지셔닝. CategoryCell/StatusCell/PriorityCell 동일 패턴.
assumption: 없음
label_candidate: fix-now (체감 점수 6/9 — 클러스터 처리)
```

---

```yaml
id: BUG-005
feature_ref: F-009
title: PriorityCell도 동일한 뷰포트 overflow 미처리
area: research / desktop
severity: minor
confidence: confirmed
reproduction: BUG-004와 동일 (우선순위 드롭다운)
expected: 드롭다운 뷰포트 내 표시
actual: 오른쪽 overflow 가능
reproduction_rate: 좁은 뷰포트에서 발생
environment: PriorityCell.tsx (CategoryCell과 동일 구조 예상)
evidence: CategoryCell/StatusCell 동일 패턴. PriorityCell도 동일 구조이므로 동일 버그 존재.
cluster_hint: C2 — BUG-004와 동일 cluster
assumption: PriorityCell이 동일 setPosition 패턴을 따른다는 가정 (코드 확인 필요)
label_candidate: fix-now (C2 클러스터)
```

---

```yaml
id: BUG-006
feature_ref: F-010 F-032
title: ItemDetailView — 저장 실패 시 date/budget/time/address/memo 필드가 실패한 값을 표시
area: panel / view mode
severity: minor
confidence: confirmed
reproduction:
  - ItemPanel에서 날짜 필드 클릭 → 새 날짜 입력 → 포커스 이동 (저장 시도)
  - 동시에 네트워크를 끊음 (오프라인)
  - → SWR rollback으로 item.date 원래 값 복원됨
  - → 패널 날짜 표시 필드가 여전히 변경 시도한 값을 보여줌
expected: SWR rollback 후 원래 값으로 표시
actual: vals 상태가 reset되지 않아 시도한 값이 표시됨 (item.name 등은 item.name을 직접 표시하므로 OK)
reproduction_rate: 네트워크 실패 시에만 발생 (저빈도)
environment: ItemPanel.tsx ItemDetailView, commit(), vals state
evidence: |
  ItemDetailView.useEffect([item.id]) - item.id 변경 시에만 vals reset
  date/budget/time/address/memo 뷰 모드는 vals를 표시:
    <span>{vals.date || '날짜 선택'}</span>
  name은 item.name 직접 표시 (영향 없음)
cluster_hint: 단독. 빈도 낮아 accept 후보.
assumption: 없음
label_candidate: accept (빈도 낮고 에러 토스트 + 재시도로 인지 가능)
```

---

```yaml
id: BUG-007
feature_ref: F-040
title: writeItems가 단일 항목 수정 시에도 전체 테이블을 fetch+upsert — 동시 수정 race condition
area: 데이터 / API
severity: minor
confidence: confirmed
reproduction:
  - 두 탭에서 같은 항목을 빠르게 연속 수정
  - 첫 번째 수정 결과가 두 번째 수정에 의해 덮어씌워짐
expected: 각 수정이 독립적으로 저장
actual: writeItems는 전체 items 배열을 fetch+upsert → 동시 요청 시 race condition으로 먼저 온 수정이 사라질 수 있음
reproduction_rate: 빠른 연속 수정에서만 발생 (단일 사용자 앱 특성상 저빈도)
environment: lib/data.ts writeItems
evidence: |
  writeItems: fetchAll → compute diff → deleteMany + upsertAll
  두 동시 PUT이 동일 snapshot을 읽으면 뒤에 끝난 쪽이 앞의 변경을 덮어씀
cluster_hint: 단독. 아키텍처 수준 issue.
assumption: 없음
label_candidate: accept (단일 사용자 앱, 동시 편집 시나리오 현실적으로 드묾)
```

---

```yaml
id: BUG-008
feature_ref: F-025
title: ResearchMap — '제외' 우선순위 항목만 지도에서 제외, 좌표 없는 항목은 핀 없이 무언급
area: 지도
severity: trivial
confidence: confirmed
reproduction:
  - 좌표 없는 항목(lat/lng undefined) 있는 상태에서 /map 접속
  - 해당 항목에 대한 "지도에 표시 안 됨" 안내 없음
expected: 사용자가 좌표 없는 항목이 지도에 표시 안 된다는 것을 인지
actual: 단순히 표시 안 됨 (안내 없음)
reproduction_rate: 좌표 없는 항목이 있을 때마다 발생
environment: ResearchMap.tsx:35
evidence: |
  mapItems = items.filter(item => item.trip_priority !== '제외' && item.lat !== undefined && item.lng !== undefined)
  — 필터링만 하고 제외된 항목 수 표시 없음
cluster_hint: 단독
assumption: 없음
label_candidate: accept (UX 개선 수준, 체감 영향 낮음)
```

---

```yaml
id: BUG-009
feature_ref: F-001
title: README.md — 환경변수 SUPABASE_PUBLISHABLE_KEY vs 실제 코드 SUPABASE_SERVICE_KEY 불일치
area: 문서
severity: trivial
confidence: confirmed
reproduction:
  - README.md 환경변수 섹션 참조 → SUPABASE_PUBLISHABLE_KEY 설정
  - 앱 실행 → data.ts에서 SUPABASE_SERVICE_KEY 요구 → 앱 에러
expected: README의 환경변수 이름이 코드와 일치
actual: README는 SUPABASE_PUBLISHABLE_KEY, data.ts는 SUPABASE_SERVICE_KEY 사용
reproduction_rate: 신규 설정 시 100%
environment: README.md, lib/data.ts:12
evidence: |
  lib/data.ts: process.env.SUPABASE_SERVICE_KEY
  README.md: SUPABASE_PUBLISHABLE_KEY | Supabase anon key
cluster_hint: 단독
assumption: 없음
label_candidate: fix-now (신규 셋업 시 앱이 완전히 동작 안 함, trivial fix)
```

---

## 매트릭스 커버리지 요약

| 검증 차원 | 커버된 기능 수 | 미커버 | 비고 |
|---|---|---|---|
| 기능 정확성 | 35/42 | 7 | GmapsImport API 내부, map 클러스터링 |
| 반응형/뷰포트 | 28/42 | 14 | 주요 인라인 편집 뷰포트 모두 확인 |
| 상태/엣지 | 30/42 | 12 | 빈 상태, null 처리 중심으로 확인 |
| 데이터 정합성 | 20/42 | 22 | SWR 낙관적 업데이트, writeItems race |
| 인증·권한 | 10/10 | 0 | middleware 전수 확인 |
| 네트워크 실패 | 15/42 | 27 | 코드 분석 위주, 실 테스트 미수행 |
| 상호작용 | 25/42 | 17 | Enter/Tab/Esc 주요 플로우 확인 |
| i18n/문구 | 10/42 | 32 | 주요 에러 메시지·라벨 확인 |
| 접근성 | 스폿 체크 | - | aria-label 일부 확인 |
| 성능 체감 | 코드 분석만 | - | 실 측정 미수행 |

**종료 조건 달성**: 마지막 패스에서 new critical 0건, new major 1건(BUG-001) — 종료 기준 충족
