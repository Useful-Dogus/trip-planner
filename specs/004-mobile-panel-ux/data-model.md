# Data Model: 모바일 패널 UX 개선

**Phase 1 Output** | Branch: `004-mobile-panel-ux`

---

## Overview

이 기능은 순수 UI/UX 개선으로, 백엔드 데이터 모델 변경이 없다. 변경 사항은 React 컴포넌트의 **UI 상태(State) 모델**에 국한된다.

---

## UI State Model

### ItemPanel 컴포넌트 상태

| 상태 필드 | 타입 | 기존 | 신규 | 설명 |
|---------|------|------|------|------|
| `mode` | `'view' \| 'edit'` | 있음 | 유지 | 현재 패널 모드 |
| `isDirty` | `boolean` | 없음 | **추가** | 편집 폼에 저장되지 않은 변경사항 존재 여부 |
| `confirmingClose` | `boolean` | 없음 | **추가** | 인라인 닫기 확인 UI 표시 여부 |
| `keyboardHeight` | `number` | 없음 | **추가** | Visual Viewport API로 감지한 가상 키보드 높이(px) |

### PanelItemForm 컴포넌트 Props 변경

| Prop | 타입 | 기존 | 신규 | 설명 |
|------|------|------|------|------|
| `onDirtyChange` | `(dirty: boolean) => void` | 없음 | **추가** | dirty 상태 변경 시 부모에 알림 |
| `onDelete` | `(id: string) => void` | 있음 | **제거** | 삭제 버튼이 헤더로 이동하므로 불필요 |

### Dirty 상태 계산 규칙

```
isDirty = (
  form.name !== item.name ||
  form.category !== item.category ||
  form.status !== item.status ||
  form.priority !== (item.priority ?? '') ||
  form.address !== (item.address ?? '') ||
  form.lat !== (item.lat?.toString() ?? '') ||
  form.lng !== (item.lng?.toString() ?? '') ||
  form.budget !== (item.budget?.toString() ?? '') ||
  form.memo !== (item.memo ?? '') ||
  form.date !== (item.date ?? '') ||
  form.time_start !== (item.time_start ?? '') ||
  JSON.stringify(form.links.filter(l => l.url.trim())) !==
    JSON.stringify(item.links ?? [])
)
```

---

## 변경 없는 데이터 모델

- `TripItem` 타입: 변경 없음
- Supabase DB 스키마: 변경 없음
- API 엔드포인트: 변경 없음
