# Implementation Plan: NYC Trip Planner MVP

**Branch**: `001-trip-planner-mvp` | **Date**: 2026-03-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-trip-planner-mvp/spec.md`

---

## Summary

본인과 아내 두 명이 사용하는 뉴욕 10일 여행 플래너. 로컬 Next.js 서버 + ngrok + JSON 파일 저장으로 외부 서비스 의존성 없이 구축한다. 리서치(후보 목록·지도)와 일정(확정 일정 목록·동선 지도) 두 뷰를 제공하며, ID/PW 인증으로 보호한다.

---

## Technical Context

**Language/Version**: TypeScript + Node.js 18+
**Primary Dependencies**: Next.js 14+ (App Router), Tailwind CSS, react-leaflet + Leaflet.js, jose (JWT)
**Storage**: JSON 파일 (`data/items.json`) — 원자적 파일 쓰기 (`fs.promises.rename`)
**Testing**: 해당 없음 (개인 여행 도구, 테스트 작성 생략)
**Target Platform**: 브라우저 (macOS Chrome/Safari + iOS Safari) + Node.js 로컬 서버
**Project Type**: Web application (Next.js full-stack)
**Performance Goals**: 50개 항목, 2인 동시 접속 — 성능 제약 없음
**Constraints**: iOS Safari 호환, ngrok HTTPS 환경 동작, SSR 비활성화 필요 (Leaflet)
**Scale/Scope**: 2인 사용자, 10일 여행, 약 50개 항목

---

## Constitution Check

Constitution이 미작성 상태(템플릿 기본값)이므로 별도 게이트 없음. 아래 자체 품질 기준으로 대체.

- [x] 외부 서비스 의존성 최소화 (Supabase·Vercel 제거)
- [x] 단일 프로젝트 구조 (모노레포 불필요)
- [x] 데이터 모델 확정 (`data-model.md`)
- [x] API 계약 정의 (`contracts/api.md`)
- [x] 개발자 수동 작업 명시 (`spec.md` Implementation Responsibilities)

---

## Project Structure

### Documentation (this feature)

```text
specs/001-trip-planner-mvp/
├── plan.md          ← 이 파일
├── spec.md
├── research.md      ← Phase 0 완료
├── data-model.md    ← Phase 1 완료
├── quickstart.md    ← Phase 1 완료
├── contracts/
│   └── api.md       ← Phase 1 완료
└── tasks.md         ← /speckit.tasks 로 생성 예정
```

### Source Code (repository root)

```text
/
├── app/
│   ├── login/
│   │   └── page.tsx                  # 로그인 페이지
│   ├── research/
│   │   └── page.tsx                  # 리서치 뷰 (목록 + 지도 탭)
│   ├── schedule/
│   │   └── page.tsx                  # 일정 뷰 (목록 + 지도 탭)
│   ├── items/
│   │   ├── new/
│   │   │   └── page.tsx              # 항목 추가 폼
│   │   └── [id]/
│   │       └── page.tsx              # 항목 수정/삭제 폼
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   └── logout/route.ts
│       ├── items/
│       │   ├── route.ts              # GET 전체, POST 추가
│       │   └── [id]/route.ts         # GET, PUT, DELETE
│       └── geocode/route.ts          # 주소→좌표 변환
├── components/
│   ├── Map/
│   │   ├── ResearchMap.tsx           # 리서치 지도 (SSR 비활성)
│   │   └── ScheduleMap.tsx           # 일정 지도 (SSR 비활성)
│   ├── Items/
│   │   ├── ItemForm.tsx              # 추가/수정 공용 폼
│   │   ├── ItemList.tsx              # 필터링 목록
│   │   └── ItemCard.tsx              # 개별 항목 카드
│   └── UI/
│       ├── StatusBadge.tsx
│       └── PriorityBadge.tsx
├── lib/
│   ├── auth.ts                       # JWT sign/verify (jose)
│   ├── data.ts                       # JSON 읽기/쓰기 (원자적)
│   └── geocode.ts                    # Nominatim 래퍼
├── types/
│   └── index.ts                      # TripItem, Link, 열거형
├── data/
│   └── items.json                    # 여행 데이터 (Git 추적)
├── middleware.ts                      # 보호 라우트 JWT 검사
└── .env.example
```

**Structure Decision**: Next.js App Router 단일 프로젝트. 프론트엔드/백엔드 분리 없음. API Routes가 백엔드 역할.

---

## UI Design

### 기조

클린하고 가벼운 여행 앱 스타일. 기능 중심이되 과하지 않게. Notion·Linear의 타이포그래피 명확함 + 여행 앱의 밝은 분위기.

### 레이아웃

**모바일 (iPhone)**
- 하단 탭 네비게이션: `리서치 / 일정 / + 추가`
- 상단 탭 스위처: `목록 / 지도`
- 콘텐츠 영역이 화면 대부분 차지

**데스크탑 (MacBook)**
- 좌측 사이드바(좁게): 네비게이션 + 로그아웃
- 우측 메인 영역: 탭 스위처 + 콘텐츠

### 색상 체계

| 용도 | 값 |
| ---- | -- |
| 배경 | `white` / `gray-50` |
| 카드 배경 | `white` |
| 카드 테두리 | `gray-200` |
| 텍스트 주 | `gray-900` |
| 텍스트 보조 | `gray-500` |
| 액션 버튼 (저장·추가) | `gray-900` (검정 단색) |
| 위험 버튼 (삭제) | `red-500` |

카테고리 핀·배지 색상은 `data-model.md` 참고 (300~400 레벨 파스텔 계열).

### 항목 카드

```
┌──────────────────────────────────────┐
│ ● 식당        [확정]  [반드시]       │
│ Peter Luger Steak House              │
│ 6월 2일 19:00  ·  $120              │
└──────────────────────────────────────┘
```

- 카테고리 컬러 닷(●) + 이름(굵게) + 상태·우선순위 배지(pill)
- 날짜·시간·예산은 `gray-500` 소형 텍스트

### 배지 스타일

`배경 100 + 텍스트 700` 조합. 강한 색 배제. 예:
- `확정` → `bg-emerald-100 text-emerald-700`
- `반드시` → `bg-rose-100 text-rose-700`
- `탈락` → `bg-red-100 text-red-400` (더 흐리게)

### 폼 (항목 추가/수정)

- 단일 스크롤, 섹션 구분: `기본 정보 / 위치 / 링크 / 메모`
- 상태·우선순위 셀렉트: 열면 각 옵션의 설명 함께 표시
- 링크: `+ 링크 추가` 버튼으로 동적 행 추가

### 지도

- 콘텐츠 영역 전체 높이
- 좌상단 플로팅 탭 스위처 `[목록] [지도]`
- 일정 지도: 상단 날짜 칩 가로 스크롤 (10일치)

---

## Complexity Tracking

Constitution 위반 없음. 해당 없음.
