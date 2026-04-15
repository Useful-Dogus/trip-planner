# 079 — 기술 설계

## 핵심 변경

### 검색 매칭 헬퍼

두 곳(research/page.tsx, ItemList.tsx)에 동일한 로직이 중복되어 있다.
간단한 인라인 변경이므로 별도 유틸 함수 추출 없이 두 파일을 직접 수정한다.

**변경 전:**
```ts
if (q && !item.name.toLowerCase().includes(q)) return false
```

**변경 후:**
```ts
if (q) {
  const haystack = [item.name, item.address, item.memo]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  if (!haystack.includes(q)) return false
}
```

### Placeholder 문구

```
"이름으로 검색..."  →  "이름·주소·메모로 검색..."
```

두 파일의 `<input placeholder=...>` 를 수정한다.

## 영향 범위

- `app/research/page.tsx` — filteredItems useMemo
- `components/Items/ItemList.tsx` — filtered useMemo
- 각 파일의 placeholder prop

## 테스트 전략

빌드 + lint 자동 검증.
수동: 개발 서버에서 주소/메모 단어로 검색하여 결과 확인.
