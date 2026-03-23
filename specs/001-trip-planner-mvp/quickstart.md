# Quickstart: NYC Trip Planner MVP

**Branch**: `001-trip-planner-mvp`

---

## 사전 준비

- Node.js 18+
- ngrok ([설치](https://ngrok.com/download))
- Git

---

## 로컬 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env.local
```

`.env.local` 편집:
```env
AUTH_ID=본인이_원하는_아이디
AUTH_PASSWORD=본인이_원하는_비밀번호
JWT_SECRET=32자_이상_랜덤_문자열
```

```bash
# 3. 개발 서버 실행
npm run dev
# → http://localhost:3000
```

---

## 아이폰 접속 (ngrok)

```bash
# 터미널 새 탭에서
ngrok http 3000
```

ngrok이 출력한 `https://xxxx.ngrok-free.app` URL을 아이폰 Safari에서 열거나 아내와 공유.

> **주의**: ngrok 무료 플랜은 서버 재시작 시 URL이 바뀜. 바뀔 때마다 공유 필요.

---

## 데이터 직접 편집

`data/items.json`을 텍스트 에디터로 직접 수정한 뒤 브라우저를 새로고침하면 즉시 반영.

```bash
# 변경 후 Git에 저장 (짧게 자주 커밋하는 습관 권장)
git add data/items.json
git commit -m "데이터 $(date +%m/%d)"
git push
```

### 데이터 관리 주의사항

```bash
# 커밋 전 변경 내용 확인
git diff data/items.json

# ⚠️ 절대 실행하지 말 것 — 앱에서 추가한 미커밋 데이터가 소멸됨
git checkout -- data/items.json
git restore data/items.json
```

> **동기화 정책**: 아이폰(ngrok)에서 변경한 내용은 맥북 `items.json`에 즉시 반영된다. Git은 실시간 동기화 수단이 아니라 이력 관리·백업 수단이다. 두 사람이 동시에 서로 다른 항목을 수정하는 경우 마지막 저장이 우선된다(last-write-wins). 동시 편집 충돌 가능성은 낮으나, 중요한 데이터 작업 전에는 상대방이 편집 중인지 확인하는 것이 좋다.

---

## 프로젝트 구조

```
/
├── app/
│   ├── login/                  # 로그인 페이지
│   ├── research/               # 리서치 뷰 (목록 + 지도 탭)
│   ├── schedule/               # 일정 뷰 (목록 + 지도 탭)
│   ├── items/
│   │   ├── new/                # 항목 추가
│   │   └── [id]/               # 항목 수정/삭제
│   └── api/
│       ├── auth/login/         # POST: 로그인
│       ├── auth/logout/        # POST: 로그아웃
│       ├── items/              # GET: 목록, POST: 추가
│       ├── items/[id]/         # GET/PUT/DELETE: 단일 항목
│       └── geocode/            # GET: 주소→좌표 변환
├── components/
│   ├── Map/                    # 지도 컴포넌트 (SSR 비활성화)
│   ├── Items/                  # 항목 목록·카드·폼
│   └── UI/                     # 배지 등 공통 컴포넌트
├── lib/
│   ├── auth.ts                 # JWT sign/verify
│   ├── data.ts                 # JSON 파일 읽기/쓰기
│   └── geocode.ts              # Nominatim 래퍼
├── types/
│   └── index.ts                # TripItem, Link, Category, Status, Priority
├── data/
│   └── items.json              # 여행 데이터 (Git 추적 대상)
├── middleware.ts                # 인증 라우트 보호
└── .env.example
```

---

## 환경 변수 목록

| 변수 | 필수 | 설명 |
| ---- | ---- | ---- |
| `AUTH_ID` | ✅ | 로그인 아이디 |
| `AUTH_PASSWORD` | ✅ | 로그인 비밀번호 |
| `JWT_SECRET` | ✅ | JWT 서명 시크릿 (32자 이상 권장) |
