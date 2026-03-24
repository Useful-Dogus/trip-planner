# Research: 이미 로그인된 경우 /login 리다이렉트

**Date**: 2026-03-24

## 기존 구현 분석

### 결정: 현재 구현이 요구사항을 만족함

**코드 위치**: `app/login/page.tsx` (서버 컴포넌트)

```typescript
export default async function LoginPage() {
  // T034: 이미 로그인된 경우 /research 로 리다이렉트
  const token = cookies().get('auth')?.value
  if (token && (await verifyToken(token))) {
    redirect('/research')
  }

  return <LoginForm />
}
```

**근거**:
- `cookies()`로 `auth` 쿠키를 서버에서 읽음
- `verifyToken()`으로 JWT 유효성 검사 (만료/위변조 모두 처리)
- 유효하면 `redirect('/research')` 호출 - 페이지 렌더링 전에 실행됨
- 유효하지 않으면 `LoginForm` 렌더링

**대안 검토**:
- **middleware.ts에서 처리**: 더 일찍 처리되지만 현재 구현도 서버 사이드에서 처리되므로 차이 없음. 미들웨어에 추가하면 복잡도가 늘어남.
- **클라이언트 사이드 처리**: 로그인 폼이 잠깐 보일 수 있으므로 부적절.

## 결론

별도 구현 불필요. 이슈는 기존에 이미 구현된 상태이며, GitHub 이슈를 닫는 PR만 필요.
