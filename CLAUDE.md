# trip-planner Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-05-19

## Active Technologies
- TypeScript 5.x + Node.js 18+ + Next.js 14+ (App Router), React 18, Tailwind CSS 3.x (004-mobile-panel-ux)
- N/A (UI 전용 변경) (004-mobile-panel-ux)
- TypeScript 5.x + Node.js 18+ + Next.js 14.2.0 (App Router), React 18.3.1, Tailwind CSS 3.x, SWR (신규 추가) (005-data-caching-fast-ux)
- Supabase (서버), localStorage (클라이언트 캐시) (005-data-caching-fast-ux)
- TypeScript 5.x + Node.js 18+ + Next.js 14.2.0 (App Router), React 18.3.1, fuse.js (신규), @supabase/supabase-js (006-gmaps-import)
- Supabase (PostgreSQL) — `items` 테이블에 `google_place_id` 컬럼 추가 (006-gmaps-import)
- Markdown (표준) + N/A (문서 파일만 작성) (010-add-readme-docs)
- TypeScript 5.x + Next.js 14 (App Router), React 18, Tailwind CSS 3.x (013-filter-ui-mobile)
- N/A (클라이언트 상태만 변경) (013-filter-ui-mobile)
- TypeScript 5.x + Next.js 14 (App Router), React 18, Tailwind CSS 3.x, SWR (014-nav-ux-overhaul)
- N/A (UI 전용 변경, 데이터 모델 변경 없음) (014-nav-ux-overhaul)
- TypeScript 5.x, Node.js 18+ + Next.js 14 (App Router), React 18, `@supabase/supabase-js` ^2.100, `@supabase/ssr` (신규 추가), Tailwind 3.x (082-supabase-auth)
- Supabase Auth (auth.users 자동 관리). 본 이슈 자체 신규 테이블 없음. 후속 #108 에서 `trip_members` 등 추가 예정. (082-supabase-auth)

- TypeScript 5.x + Node.js 18+ + Next.js 14+ (App Router), Tailwind CSS 3.x, React 18 (003-panel-editing-ux)
- Supabase (데이터 저장소, 파일 기반에서 마이그레이션 완료)

- TypeScript + Node.js 18+ + Next.js 14+ (App Router), Tailwind CSS, react-leaflet + Leaflet.js, jose (JWT) (001-trip-planner-mvp)

## Project Structure

```text
app/           # Next.js App Router (pages + API routes)
components/    # React 컴포넌트 (Map/, Items/, UI/)
lib/           # 공통 유틸 (auth.ts, data.ts, geocode.ts)
types/         # TypeScript 타입 정의
supabase/      # DB 스키마 (schema.sql)
middleware.ts  # JWT 인증 라우트 보호
```

## Commands

npm run dev # 로컬 개발 서버 (http://localhost:3000)

## Code Style

TypeScript + Node.js 18+: Follow standard conventions

## Design Guidelines

- 신규 화면·컴포넌트를 디자인하거나 기존 UI 를 수정할 때는 [docs/design-guidelines.md](docs/design-guidelines.md) 를 먼저 참고한다.
- Shopify Polaris, Apple HIG, Microsoft Fluent 2 의 핵심 원칙을 trip-planner 맥락에 맞춰 정리한 단일 가이드이며, 컬러/타이포/레이아웃/모션/접근성/콘텐츠/패턴/체크리스트를 포함한다.
- hex 직접 사용·변칙 spacing·임의 radius/shadow 는 가이드 토큰 체계로 정렬한다.

## Recent Changes
- 082-supabase-auth: Added TypeScript 5.x, Node.js 18+ + Next.js 14 (App Router), React 18, `@supabase/supabase-js` ^2.100, `@supabase/ssr` (신규 추가), Tailwind 3.x
- 014-nav-ux-overhaul: Added TypeScript 5.x + Next.js 14 (App Router), React 18, Tailwind CSS 3.x, SWR
- 013-filter-ui-mobile: Added TypeScript 5.x + Next.js 14 (App Router), React 18, Tailwind CSS 3.x



<!-- MANUAL ADDITIONS START -->

## Attribution Policy

- 커밋 메시지에 `Co-Authored-By: Claude` 등 AI 관련 문구를 추가하지 말 것
- PR 본문에 `🤖 Generated with Claude Code` 등 AI 관련 문구를 추가하지 말 것

## Directory Rules

- 구현 완료된 스펙의 `specs/` 문서는 과거 히스토리 보관용이므로 수정하지 않는다.

## Basics-First Rule (신규 기능 작업 시 필독)

**배경 — 2026-05-20 시말서.** 마일스톤 1 진행 중 ‟멀티 사용자 백본·공유·시각화" 같은 위 레이어를 쌓는 동안 기본 동작이 방치되어 사용자에게 지적받았다. 발견된 결함의 종류:

- 핵심 객체(`trip`)의 U/D 가 UI·API 양쪽에 없음에도 마법사가 ‟나중에 바꿀 수 있어요" 라고 거짓 약속.
- 모든 trip 페이지에 ‟지금 보고 있는 여행 이름" 자체가 표시되지 않음.
- 단일 trip 시대 상수(`TRIP_DATE_MIN/MAX = 2026-07`)가 API 검증에 남아있어, 다른 trip 만들면 item 추가가 물리적으로 불가.
- 카피는 "지도를 길게 눌러 추가하세요" 라고 안내하지만 핸들러는 0건.
- 시트가 콘텐츠와 무관하게 80vh 고정.
- ‟+ 새 항목" 진입점이 뷰마다 비대칭(데스크탑 map 없음, 모바일 schedule 없음, 데스크탑 빈 상태 CTA 없음).
- 모바일 nav 에 프로필·gmaps-import 진입점 자체가 없음.
- `window.confirm()` 같은 네이티브 다이얼로그가 디자인 가이드 무시하고 산재.

**원인.** 새 기능 PR 마다 ‟동작하는가" 만 보고 ‟다른 기본 동선과 일관되는가 / 사용자 매일 경로가 모두 닫혀있는가 / 카피가 약속한 동작이 실제 가능한가" 를 보지 않음. 이슈 맵의 페이즈를 ‟진행" 하는 데 매몰됨.

### 신규 기능 작업 전 필수 체크

> 아래 체크는 *추함을 알아보는* 운영판이다. 그 **이유**(판단 레이어)는 [docs/taste-for-waypost.md](docs/taste-for-waypost.md) 에 있다 — 특히 #2·#4(CRUD/진입점 대칭)는 거기 1.5 Symmetry, #3(카피 정직성)은 1.9 Honest 와 한 몸이다.

새 페이지/기능을 추가하거나 기존을 수정할 때 **반드시** 아래를 자기검열한다. 위반이 있으면 그 자리에서 닫거나, 닫을 수 없으면 후속 이슈를 같은 PR 에서 생성해 본 PR 본문에 명시한다.

#### 1. 컨텍스트 표시

- 사용자가 ‟지금 어떤 여행/항목/그룹을 보고 있는지" 화면 어디에서 알 수 있는가?
- trip 내부 페이지면 trip 제목·기간이 보여야 한다. ‟목록", ‟지도", ‟일정" 같은 일반명만 두지 않는다.

#### 2. CRUD 대칭

- 새로 다루는 객체(또는 기존 객체의 새 필드)에 대해 **UI · API 양쪽에서 C/R/U/D 4 동작이 모두 닫혀있는가?**
- 한 쪽만 추가하지 않는다. ‟API 는 있고 UI 는 나중에" / ‟UI 는 만들었지만 API 는 다음 PR" 모두 금지.
- 빈 상태에서도 ‟추가" CTA 가 1클릭 안에 도달 가능한가?

#### 3. 카피 정직성

- 화면에 적은 ‟나중에 바꿀 수 있어요", ‟길게 눌러 추가", ‟동선의 기준점" 같은 약속이 **실제로 구현되어 있는가?**
- 구현 없이 약속하지 않는다. 약속할 수밖에 없다면 같은 PR 에서 그 동작도 구현하거나 카피를 빼거나, 추적 이슈 번호를 카피 옆 주석으로 명시.

#### 4. 진입점 일관성

- 같은 동작(‟+ 새 항목" 등)이 list / map / schedule × 모바일 / 데스크탑 6 조합 모두에서 1클릭에 도달 가능한가?
- 모바일 nav 에서 누락된 페이지는 없는가?
- 뷰 전환 시 검색어·필터·정렬·선택 상태가 보존되는가? (URL search params 또는 sessionStorage)

#### 5. 모달·시트 사이징

- 새로 추가/수정한 시트가 콘텐츠 양에 맞게 표시되는가?
- 모바일 바텀시트는 `Sheet` 의 콘텐츠 적응형 모드(`maxHeight: 90vh; height: auto`) 를 쓰고 있는가?
- `window.confirm()` / `window.alert()` 사용 금지. 공통 `<ConfirmDialog />` 사용.

#### 6. 키보드·접근성

- esc/backdrop 닫기, 포커스 트랩, 스크롤락이 일관되는가? (`Sheet` 컴포넌트 사용으로 자동 충족)
- 모바일에서 키보드 올라왔을 때 입력창·저장 버튼이 가려지지 않는가? (`visualViewport` 사용)

#### 7. 단일-trip 시대 잔재 금지

- `TRIP_DATE_MIN/MAX` 같은 단일 trip 가정 상수에 의존하지 않는다. 항상 현재 trip context(기간·지역·basecamp) 에서 동적으로 끌어온다.
- ‟NYC", ‟뉴욕", ‟2026년 7월" 같은 단일 trip 시대 카피 잔재가 없는지 grep 확인.

### 작업 끝낼 때

PR 본문에 다음 5문항 체크박스를 포함한다 (G-22 로 템플릿화 예정, 그 전까지 수동):

```
- [ ] 이 페이지·기능에 ‟지금 보고 있는 여행 이름" 이 보이는가?
- [ ] 이 페이지에서 핵심 객체의 C/R/U/D 가 모두 UI 로 가능한가? (해당 시)
- [ ] 이 페이지가 여는 모든 모달·시트는 콘텐츠 양에 맞게 표시되는가?
- [ ] 마법사·카피에서 약속한 모든 동작이 실제로 가능한가?
- [ ] 모바일·데스크탑 양쪽에서 동작이 동등한가?
```

### 위 레이어 동결

기본기 게이트 (#142-#163, ‟G-1 ~ G-22") 가 모두 닫히기 전엔 다음을 시작하지 않는다:

- #114-#116 지도 고도화(Mapbox / 3D / 등시선)
- #117-#120 시각화 페이지
- 멤버 초대 / 활동 피드 / 역할 관리

자세한 게이트 목록은 [이슈 #121](https://github.com/Useful-Dogus/trip-planner/issues/121) 본문 참조.
<!-- MANUAL ADDITIONS END -->
