# Data Model: Trip Planner 다음 버전 UX 개편

## 변경 없음

이 기능은 순수 UI 변경이다. 데이터베이스 스키마(`supabase/schema.sql`), API 엔드포인트(`/api/items`), TypeScript 타입(`types/`) 변경 없음.

## 신규 클라이언트 상태

### URL Search Params

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `?item={id}` | `string` | 현재 열린 패널의 아이템 ID |
| `?imported={id1,id2,...}` | `string` | 임포트 직후 하이라이트할 아이템 ID 목록 (1회성) |

### 신규 컴포넌트 상태

| 컴포넌트 | 상태 | 타입 | 설명 |
|---------|------|------|------|
| `ScheduleTable` | `undatedCollapsed` | `boolean` | 미배정 섹션 접힘 여부 (기본: false) |
| `app/research/page.tsx` | `highlightedIds` | `Set<string>` | 하이라이트할 아이템 ID 집합 |

## 기존 상태 변경

| 컴포넌트 | 기존 | 변경 후 |
|---------|------|--------|
| `app/research/page.tsx` | `tab: 'list'\|'table'\|'map'` | 제거 (CSS로 대체) |
| `app/schedule/page.tsx` | `tab: 'table'\|'map'` | 제거 (map → `/map` 별도 탭) |
| `app/research/page.tsx` | `selectedItemId` (로컬 state 전용) | URL `?item` param과 동기화 |
| `app/schedule/page.tsx` | 동일 | 동일 |
