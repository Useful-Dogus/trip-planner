# closeout.md — QA 캠페인 최종 보고서
> 2026-04-27 Full Pass 종료 보고
> 캠페인 기간: 2026-04-27 (단일 세션, 완전 자동화 실행)

---

## 실행 요약

| 단계 | 담당 AI | 산출물 | 상태 |
|------|---------|--------|------|
| ① Feature Investigation | Explore 에이전트 (Haiku) | features.md (F-001-F-042) | ✅ |
| ② Defect Investigation | 정적 코드 분석 | discovery.md (BUG-001-BUG-009) | ✅ |
| ③ Self-triage | 체감 점수 기반 | triage.md | ✅ |
| ④ Fix + Merge | 코드 수정 + PR #84 | main 브랜치 반영 | ✅ |
| ⑤ Closeout | — | 본 문서 + known-issues.md | ✅ |

---

## 결함 요약

총 **9개** 결함 발견 → **6개 수정** (main 병합 완료), **3개 accept** (known-issues.md 기록)

### 수정 완료 (fix-now)

| ID | 제목 | 심각도 | 수정 내용 |
|----|------|--------|-----------|
| BUG-001 | 모바일 일정뷰 Enter 키 → API 400 항상 실패 | major | `ScheduleTable.tsx` MobileNewItemEditor `onKeyDown` closure 추가 |
| BUG-002 | ResearchTable Escape 취소 → spurious 항목 생성 | major | `cancelNewItemRef`로 Escape 후 blur 무시 |
| BUG-003 | ScheduleTable Escape 취소 → spurious 항목 생성 | major | 동일 패턴 적용 |
| BUG-004 | StatusCell 드롭다운 우측 viewport 오버플로우 | minor | `useLayoutEffect`로 렌더 후 overflow 보정 |
| BUG-005 | PriorityCell 드롭다운 우측 viewport 오버플로우 | minor | 동일 패턴 적용 (CategoryCell 포함) |
| BUG-009 | README 환경변수 이름 오류 | trivial | `SUPABASE_PUBLISHABLE_KEY` → `SUPABASE_SERVICE_KEY` |

병합 PR: [#84](https://github.com/Useful-Dogus/trip-planner/pull/84)

### 수정 보류 (accept)

| ID | 제목 | 이유 |
|----|------|------|
| BUG-006 | ItemDetailView 저장 실패 후 vals stale | 저빈도, 에러 토스트 + 새로고침으로 복구 가능 |
| BUG-007 | writeItems race condition | 단일 사용자 앱, 동시 편집 거의 없음 |
| BUG-008 | 지도 좌표 없는 항목 미안내 | UX 개선 수준, 기능 지장 없음 |

---

## 주요 수정 상세

### BUG-001: 모바일 Enter 키 — 가장 큰 체감 개선 (8/9점)

모바일에서 새 항목 추가 시 Enter를 누를 때마다 API 400 에러가 발생했다.
`MobileNewItemEditor`의 `onKeyDown` prop이 closure 없이 함수를 직접 전달해,
date 파라미터 자리에 사용자 입력 텍스트가 전달된 것이 원인.

```tsx
// 수정 전 (버그)
onKeyDown={handleNewItemKeyDown}

// 수정 후
onKeyDown={e => handleNewItemKeyDown(e, date)}
```

### BUG-002/003: Escape blur race — 데이터 오염 방지

새 항목 입력 중 Escape로 취소할 때, state 배치 업데이트 후 input 언마운트 시
stale closure를 참조한 blur 이벤트가 발화되어 원치 않는 항목이 생성될 수 있었다.

```tsx
// cancelNewItemRef 패턴으로 해결
const cancelNewItemRef = useRef(false)

function handleNewItemBlur() {
  if (cancelNewItemRef.current) {
    cancelNewItemRef.current = false
    return
  }
  // ... 정상 생성 로직
}

} else if (e.key === 'Escape') {
  cancelNewItemRef.current = true  // blur가 와도 생성 건너뜀
  setAddingRow(false)
  setNewItemName('')
}
```

### BUG-004/005: 드롭다운 viewport 오버플로우 — useLayoutEffect 패턴

ItemPanel의 `MetadataDropdownChip`에는 올바른 right-edge 처리가 있었으나
`CategoryCell`/`StatusCell`/`PriorityCell`에는 누락되어 있었다.
드롭다운 너비를 사전에 알 수 없으므로 `useLayoutEffect`로 렌더 후 측정해 보정.

```tsx
useLayoutEffect(() => {
  if (!position || !dropdownRef.current) return
  const dropRect = dropdownRef.current.getBoundingClientRect()
  if (dropRect.right > window.innerWidth) {
    setPosition(prev =>
      prev ? { ...prev, left: Math.max(0, prev.left - (dropRect.right - window.innerWidth)) } : prev
    )
  }
}, [position])
```

`useLayoutEffect`는 브라우저 페인트 전에 동기 실행되므로 visual flicker 없음.

---

## 검증

- TypeScript 타입 체크: `npx tsc --noEmit` — 오류 0건
- 정적 코드 분석으로 각 수정 사항의 정확성 확인

---

## 종료 판정

**캠페인 종료 기준 충족**

- 마지막 패스에서 new critical: 0건
- new major: 0건 (BUG-001은 직전 패스에서 이미 발견)
- fix-now 6건 전원 수정 후 main 병합 완료
- accept 결함 3건 known-issues.md 문서화 완료
