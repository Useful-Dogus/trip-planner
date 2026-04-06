# Implementation Plan: 구글맵 장소 가져오기

**Branch**: `006-gmaps-import` | **Date**: 2026-04-06 | **Spec**: [spec.md](spec.md)

## Summary

구글맵 공개 리스트 URL을 입력하면 장소 목록을 가져와 기존 DB와 비교 후 선택적으로 추가하는 기능.
Playwright 없이 `fetch()`로 구글맵 리스트 페이지 HTML을 파싱하며, fuse.js 기반 fuzzy match로 유사 장소를 감지한다.

## Technical Context

**Language/Version**: TypeScript 5.x + Node.js 18+
**Primary Dependencies**: Next.js 14.2.0 (App Router), React 18.3.1, fuse.js (신규), @supabase/supabase-js
**Storage**: Supabase (PostgreSQL) — `items` 테이블에 `google_place_id` 컬럼 추가
**Testing**: 수동 테스트 (기존 프로젝트 테스트 환경 없음)
**Target Platform**: Vercel serverless (Node.js 18 runtime)
**Project Type**: Web application (Next.js fullstack)
**Performance Goals**: URL 입력 후 장소 목록 표시까지 30초 이내
**Constraints**: Vercel Hobby plan 기준 serverless timeout 10초, fetch()만 사용 (Playwright 불가)
**Scale/Scope**: 단일 사용자, 리스트당 최대 수십 개 장소

## Constitution Check

Constitution이 프로젝트에 미작성 상태이므로 게이트 없음. 기존 코드 패턴을 따른다:
- API 라우트: Next.js App Router route handlers (`app/api/*/route.ts`)
- 서비스 로직: `lib/` 또는 신규 `services/` 디렉토리
- 인증: 기존 JWT 쿠키 미들웨어 재사용
- 타입: `types/index.ts` 확장

## Project Structure

### Documentation (this feature)

```text
specs/006-gmaps-import/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/
│   └── api.md           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── api/
│   └── gmaps/
│       ├── preview/
│       │   └── route.ts          # POST: URL → 장소 목록 + 분류
│       └── import/
│           └── route.ts          # POST: 선택된 장소 DB INSERT
└── gmaps-import/
    └── page.tsx                  # 구글맵 연동 페이지 (URL 입력 + 검토 화면)

components/
└── GmapsImport/
    ├── UrlInput.tsx              # URL 입력 폼
    └── CandidateList.tsx         # 검토 화면 (체크박스 목록)

services/
└── gmaps/
    ├── resolver.ts               # Short URL → Full URL 해석
    ├── fetcher.ts                # 구글맵 리스트 페이지 fetch
    ├── parser.ts                 # HTML/JSON 파싱 → GooglePlace[]
    ├── categoryMap.ts            # 구글 카테고리 → 앱 카테고리 매핑
    └── matcher.ts                # fuse.js 기반 유사도 비교

supabase/
└── schema.sql                   # google_place_id 컬럼 추가 반영

types/
└── index.ts                     # GooglePlace, ImportCandidate, ImportStatus 추가
```

## Implementation Phases

### Phase A: 백엔드 스크래핑 서비스

1. `services/gmaps/resolver.ts` — short URL HTTP redirect 해석, list ID 추출
2. `services/gmaps/fetcher.ts` — 구글맵 리스트 페이지 fetch (User-Agent 헤더 포함)
3. `services/gmaps/parser.ts` — `)]}'\n` 제거 + JSON 파싱 + GooglePlace[] 변환
4. `services/gmaps/categoryMap.ts` — 구글 place types → 앱 9개 카테고리 룩업 테이블
5. `services/gmaps/matcher.ts` — fuse.js 기반 이름 유사도 비교, ImportStatus 결정

### Phase B: API 라우트

6. `app/api/gmaps/preview/route.ts` — POST, 전체 파이프라인 (resolver → fetcher → parser → matcher)
7. `app/api/gmaps/import/route.ts` — POST, GooglePlace[] → TripItem 변환 → Supabase INSERT

### Phase C: DB 스키마 마이그레이션

8. `supabase/schema.sql` 업데이트 — `google_place_id TEXT` 컬럼 추가
9. `types/index.ts` 업데이트 — `TripItem`, `GooglePlace`, `ImportCandidate` 타입
10. `lib/data.ts` 업데이트 — `google_place_id` 필드 읽기/쓰기 반영

### Phase D: 프론트엔드

11. `app/gmaps-import/page.tsx` — 페이지 (상태 머신: idle → loading → review → importing → done)
12. `components/GmapsImport/UrlInput.tsx` — URL 입력 폼, 유효성 검사
13. `components/GmapsImport/CandidateList.tsx` — 검토 목록 (신규/유사/중복 구분 + 체크박스)
14. `components/Layout/Navigation.tsx` — "구글맵 연동" 메뉴 항목 추가
15. `middleware.ts` — `/gmaps-import` 인증 보호 추가

## Key Design Decisions

### 스크래핑 접근 방식
- 구글맵 리스트 페이지(`/maps/placelists/list/[listId]`)를 직접 fetch
- HTML 내 `)]}'\n` 접두사 JSON 데이터 추출
- **리스크**: 구글 HTML 구조 변경 시 파서 깨짐 — 파싱 실패는 `PARSE_ERROR`로 처리하고 사용자에게 안내

### 중복 감지 전략
- 1차: `google_place_id` 완전 일치 → `duplicate` (선택 불가)
- 2차: fuse.js 이름 유사도 ≥ 0.65 → `similar` (기본 선택 해제 + 경고)
- 그 외: `new` (기본 선택)

### fuse.js 설정
```typescript
{
  keys: ['name'],
  threshold: 0.35,
  distance: 100,
  includeScore: true
}
// score < 0.35 (유사도 높음) → similar로 분류
```

### Vercel timeout 대응
- 구글맵 fetch에 5초 timeout 설정 (`AbortController`)
- 응답 크기 제한: HTML 10MB 초과 시 오류 처리

## Complexity Tracking

특이 복잡성 없음. 기존 패턴을 따른다:
- 신규 `services/gmaps/` 디렉토리: 향후 독립 서비스 분리 가능한 구조
- fuse.js: 순수 JS 라이브러리, 빌드 복잡성 없음
