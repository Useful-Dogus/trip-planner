# 041-pwa — PWA 지원 (모바일 홈 화면 추가)

GitHub: #41

## 문제

여행 중 스마트폰에서 주로 사용하는 앱인데 매번 브라우저에서 URL 입력해야 함. iOS Safari / Android Chrome 의 "홈 화면에 추가" 시 일반 북마크처럼 동작하고, 앱 이름·아이콘·테마가 갖춰지지 않음.

## 사용자 시나리오

1. 사용자가 모바일 브라우저로 trip-planner 를 처음 방문한다.
2. 브라우저의 "홈 화면에 추가" 메뉴를 사용한다.
3. 홈 화면에 "Trip Planner" 라벨과 브랜드 Teal 아이콘이 생긴다.
4. 아이콘 탭 시 주소창 없는 풀스크린 모드로 앱이 실행된다.
5. 상단 status bar 색이 브랜드 톤(라이트/다크 모드 반응) 으로 표시된다.

## 완료 조건

- Lighthouse PWA installability 체크 통과(아이콘·manifest·display·start_url 완비)
- iOS Safari `홈 화면에 추가` 시 앱 이름·아이콘 표시 + 풀스크린 실행
- Android Chrome 설치 prompt 가능
- 라이트/다크 status bar 색 분기
- 본 PR 범위 외: Service Worker 기반 오프라인 캐싱 (별도 이슈)

## 범위 밖

- next-pwa 통한 SW + 오프라인 캐싱 — 후속 이슈
- 푸시 알림 — 별도 기능
