# Quickstart — 081 Apollo GraphQL

## 1. 설치
```bash
npm install
```

## 2. API 서버 기동
```bash
npm run dev:api   # apps/api 3001 포트
```

## 3. Apollo Sandbox 열기
브라우저에서 http://localhost:3001/graphql 열기 (Apollo Sandbox embed 화면).

## 4. 검증 쿼리
```graphql
query CurrentTrip {
  trip(id: "current") {
    id
    title
    startDate
    endDate
    days {
      date
      items {
        id
        name
        category
        timeStart
        place {
          id
          name
          lat
          lng
        }
      }
    }
    lodgings {
      id
      name
      date
      endDate
    }
  }
}
```

## 5. 검증 체크리스트
- [ ] 응답에 `days[]`, `lodgings[]` 가 모두 채워짐
- [ ] `google_place_id` 가 있는 item 의 `place` 가 채워지고, 없는 item 은 `null`
- [ ] 응답 `extensions.tracing` 에 리졸버별 ms 가 포함됨
- [ ] apps/api 콘솔에 `[GraphQL] trip ... <N>ms` 로그 출력
- [ ] item 50개 / day 5개 시 Supabase 호출 ≤ 10회 (로그로 확인)

## 6. REST deprecation 확인
```bash
curl -i http://localhost:3000/api/items | head -20
# 응답 헤더에 "Deprecation: true" 가 포함되어야 함
```

## 7. 회귀 확인
기존 페이지 동작:
- http://localhost:3000/list — 아이템 목록 정상
- http://localhost:3000/map — 지도/마커 정상
- http://localhost:3000/board — 일정 정상
