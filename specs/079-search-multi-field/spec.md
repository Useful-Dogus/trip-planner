# 079 — 검색 멀티필드 확장

## 배경 / 문제

현재 조사 목록과 모바일 카드 목록의 검색창은 `item.name`(제목)만 비교한다.
사용자가 주소(`address`), 메모(`memo`)에 기억하는 단서로 검색하면 결과가 나오지 않아 불편하다.

## 목표

검색어를 `name`, `address`, `memo` 세 필드에 동시에 매칭하여 결과를 반환한다.

## 범위

| 변경 대상 | 내용 |
|---|---|
| `app/research/page.tsx` | `filteredItems` — 검색 조건 확장 |
| `components/Items/ItemList.tsx` | `filtered` — 검색 조건 확장 |
| `components/UI/SearchInput.tsx` (신규 선택) | 검색 입력 컴포넌트가 분리되어 있으면 placeholder 문구 변경 |

## 검색 필드

1. `name` — 제목 (기존)
2. `address` — 주소
3. `memo` — 메모

> `links[].label` 은 이 이슈 범위에서 제외한다 (URL 검색 혼란 가능성, 별도 이슈로 검토).

## UX

- placeholder 문구를 `"이름으로 검색..."` → `"이름·주소·메모로 검색..."` 으로 변경한다.
- 검색 결과 매칭 방식: 현재와 동일하게 `toLowerCase().includes(q)` 사용 (퍼지 검색은 이 이슈 범위 밖).

## 비기능 요건

- 빈 필드(`undefined`, `null`)는 안전하게 무시한다.
- 성능: `useMemo` 의존 배열은 기존과 동일하게 유지.

## 완료 조건

1. 주소로 검색 시 해당 아이템이 결과에 포함된다.
2. 메모로 검색 시 해당 아이템이 결과에 포함된다.
3. 기존 이름 검색이 그대로 동작한다.
4. 빌드 및 lint 통과.
