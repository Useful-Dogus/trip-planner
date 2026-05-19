# Quickstart: Supabase Auth 검증

## 0. 사전 준비 (Supabase Dashboard, 사용자 작업)

1. Authentication → Providers → **Email** enabled (default ON).
2. Authentication → URL Configuration → **Site URL** 에 `http://localhost:3000` 추가, 운영 도메인도 추가.
3. Project Settings → API → **anon (public) key** 와 **Project URL** 복사.
4. `.env.local` 에 추가:
   - `NEXT_PUBLIC_SUPABASE_URL=<Project URL>`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>`
5. `.env.local` 에서 `AUTH_ID` / `AUTH_PASSWORD` / `JWT_SECRET` 제거.
6. (선택) Authentication → Email Templates 의 한국어 문구 검토.

## 1. 로컬 실행

```bash
npm install
npm run dev
```

## 2. 회원가입 (curl)

```bash
curl -sS -X POST http://localhost:3000/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"<본인이메일>","password":"<8자이상>"}'
```

응답: `{ "ok": true, "needsEmailConfirmation": true }`

→ 메일함에서 확인 링크 클릭 → `/login` 으로 redirect 되며 계정 활성화 완료.

## 3. 로그인 (UI)

- 브라우저에서 `http://localhost:3000/login` 진입.
- 이메일/비밀번호 입력 후 로그인.
- `/list` 로 진입 + 새로고침해도 세션 유지 확인.

## 4. 로그아웃

```bash
curl -sS -X POST http://localhost:3000/api/auth/logout --cookie cookies.txt
```

→ 이후 `/list` 직접 접근 시 `/login` 으로 redirect.

## 5. 비밀번호 재설정

```bash
curl -sS -X POST http://localhost:3000/api/auth/reset-password \
  -H 'Content-Type: application/json' \
  -d '{"email":"<가입이메일>"}'
```

→ 메일 도착 → 링크 클릭 → `/auth/update-password` 페이지 진입 → 새 비밀번호 제출 → 새 비밀번호로 로그인.

## 6. 회귀 체크리스트

- [ ] 로그인 없이 `/list` → `/login` redirect
- [ ] 로그인 없이 `/api/items` GET → 401
- [ ] 로그인 후 `/list` 진입 가능
- [ ] 로그아웃 후 동일 경로 → `/login` redirect
- [ ] 잘못된 비밀번호 → 401 + 한국어 에러
- [ ] 가입 미확인 계정 로그인 → 명확한 에러 또는 안내
