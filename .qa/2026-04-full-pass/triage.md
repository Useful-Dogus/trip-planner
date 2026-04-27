# triage.md — trip-planner 결함 트리아지
> AI ③ Defect Triage 산출물. 체감 영향 점수 기준.
> 생성일: 2026-04-27
> 점수 체계: 빈도(1-3) + 짜증(1-3) + 우회(1-3) → 합계 7-9=fix-now / 5-6=후보 / 3-4=accept

---

## fix-now (수정 대상)

| ID | 제목 | 빈도 | 짜증 | 우회 | 합계 | 클러스터 |
|----|------|------|------|------|------|----------|
| BUG-001 | 모바일 일정뷰 Enter 키 → API 400 항상 실패 | 3 | 3 | 2 | **8** | 단독 |
| BUG-002 | ResearchTable Escape 취소 → 항목 spurious 생성 | 2 | 3 | 1 | **6** | C1 |
| BUG-003 | ScheduleTable Escape 취소 → 항목 spurious 생성 | 2 | 3 | 1 | **6** | C1 |
| BUG-004 | StatusCell 드롭다운 우측 viewport 오버플로우 | 2 | 2 | 2 | **6** | C2 |
| BUG-005 | PriorityCell 드롭다운 우측 viewport 오버플로우 | 2 | 2 | 2 | **6** | C2 |
| BUG-009 | README 환경변수 이름 오류 (신규 셋업 시 앱 불동) | 3 | 3 | 1 | **7** | 단독 |

**BUG-002/003 점수 근거**: confidence=hypothesis이지만 데이터 오염(원치 않는 항목 생성)이 발생하면 사용자가 직접 찾아 삭제해야 하므로 우회 난이도 1. 실제 발생 여부는 브라우저 환경에 의존하지만 React 18 이벤트 위임 구조상 blur 발화 가능성이 높아 fix-now로 상향.

**BUG-004/005 클러스터 처리**: 개별 점수 6점(후보)이나 CategoryCell도 동일 패턴이므로 C2 클러스터로 묶어 한 번에 수정.

---

## accept (미수정 — 빈도/체감 낮음)

| ID | 제목 | 빈도 | 짜증 | 우회 | 합계 | 이유 |
|----|------|------|------|------|------|------|
| BUG-006 | ItemDetailView 저장 실패 후 vals stale 표시 | 1 | 2 | 2 | 5 | 네트워크 실패 시에만, 에러 토스트 + 새로고침으로 인지·복구 가능 |
| BUG-007 | writeItems 전체 테이블 read+upsert race | 1 | 2 | 2 | 5 | 단일 사용자, 동시 탭 편집 시나리오 현실적으로 드묾 |
| BUG-008 | 지도 좌표 없는 항목 미안내 | 2 | 1 | 3 | 6 | UX 개선 수준, 기능에 지장 없음 |

---

## 수정 계획

```
PR-1  feat(fix): BUG-001 — 모바일 일정뷰 Enter 키 closure 수정
PR-2  feat(fix): BUG-002/003 — C1 Escape 취소 blur race 방지
PR-3  feat(fix): BUG-004/005 — C2 드롭다운 viewport 오버플로우 수정 (CategoryCell 포함)
PR-4  fix: BUG-009 — README 환경변수 이름 정정
```
