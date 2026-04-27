# known-issues.md — 수정 보류 결함
> 2026-04-27 Full QA Pass accept 판정 결함. 향후 참고용.

---

## BUG-006 — ItemDetailView 저장 실패 후 필드 표시 값 stale

**영역**: panel / view mode  
**심각도**: minor  
**체감 점수**: 5/9 (빈도1 + 짜증2 + 우회2)

저장 실패(네트워크 오류) 후 SWR rollback으로 서버 데이터는 원복되지만,
ItemDetailView의 `vals` 로컬 상태가 `item.id` 변경 시에만 reset되어
date/budget/time/address/memo 필드가 실패한 값을 계속 표시한다.
name 필드는 `item.name`을 직접 참조하므로 영향 없음.

**재현**: 오프라인 상태에서 날짜 필드 수정 후 포커스 이동 → 에러 토스트 → 패널 날짜가 시도한 값 표시.

**accept 이유**: 네트워크 실패 시에만 발생 (저빈도), 에러 토스트 + 새로고침으로 사용자 인지·복구 가능.

**수정 방법 (참고)**: `useEffect` 의존성에 `item.date`, `item.budget` 등 추가하거나, 저장 실패 시 `setVals(v => ({ ...v, [field]: item[field] }))` 롤백.

---

## BUG-007 — writeItems 전체 테이블 read+upsert race condition

**영역**: 데이터 / API  
**심각도**: minor  
**체감 점수**: 5/9 (빈도1 + 짜증2 + 우회2)

`lib/data.ts` `writeItems`는 단일 항목 수정 시에도 전체 테이블을 fetch 후 diff+upsert한다.
두 탭에서 같은 항목을 빠르게 연속 수정하면 동일 snapshot을 읽은 뒤 덮어쓸 수 있다.

**accept 이유**: 단일 사용자 앱 특성상 동시 편집 시나리오가 현실적으로 거의 발생하지 않음.

**수정 방법 (참고)**: API route를 PATCH 기반으로 변경해 단일 항목만 수정하거나, Supabase의 row-level update를 직접 사용.

---

## BUG-008 — 지도에서 좌표 없는 항목 미표시 안내 없음

**영역**: 지도  
**심각도**: trivial  
**체감 점수**: 6/9 (빈도2 + 짜증1 + 우회3)

`ResearchMap.tsx`의 mapItems 필터가 `lat/lng undefined` 항목을 제거하지만
지도 상단에 "N개 항목이 좌표 없음" 같은 안내가 없어 사용자가 누락을 인지 못할 수 있다.

**accept 이유**: UX 개선 수준. 기능 동작에 지장 없고 체감 영향이 낮음.

**수정 방법 (참고)**: 필터 전후 count 비교 후 차이가 있을 때 info toast 또는 지도 하단 badge 표시.
