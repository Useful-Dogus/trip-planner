# Implementation Plan: 공유 페이지 /share/{token}

**Spec**: [spec.md](./spec.md)
**Issue**: [#113](https://github.com/Useful-Dogus/trip-planner/issues/113)
**Branch**: `110-share-page`

## 핵심 결정

### 1. 익명 데이터 페치 — 단일 RPC

PostgREST의 single-request-single-transaction 모델에서 `set_share_token` + 후속 쿼리는 동작 보장이 약하다.
→ **단일 RPC `get_shared_trip(p_token uuid)` 추가**. SECURITY DEFINER 함수가 토큰 유효성 검증 + trip + items를 JSON으로 한 번에 반환.

```sql
create or replace function public.get_shared_trip(p_token uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_trip_id uuid;
  v_result jsonb;
begin
  select s.trip_id into v_trip_id
    from public.shares s
   where s.token = p_token
     and s.revoked_at is null
     and (s.expires_at is null or s.expires_at > now());

  if v_trip_id is null then
    return null;
  end if;

  select jsonb_build_object(
    'trip', to_jsonb(t.*),
    'items', coalesce((
      select jsonb_agg(to_jsonb(i.*) order by i.date nulls last, i.time_start nulls last, i.created_at)
        from public.items i
       where i.trip_id = v_trip_id
    ), '[]'::jsonb)
  ) into v_result
    from public.trips t
   where t.id = v_trip_id;

  return v_result;
end
$$;

grant execute on function public.get_shared_trip(uuid) to anon, authenticated;
```

장점:
- 토큰 무효 시 `null` 반환 → 단일 분기로 안내 페이지 처리.
- RLS 우회 없이 RPC 내부에서만 trip+items 노출 → 토큰 외 데이터 누출 0.
- 1-round-trip → 모바일 4G에서 빠른 첫 페인트.

### 2. 라우트 구조

- `app/share/[token]/page.tsx` — Next.js 서버 컴포넌트.
  - 토큰 형식 검증 → RPC 호출 → null이면 `<ShareInvalid />`, 아니면 `<SharePageView />`.
- `app/share/[token]/layout.tsx` — 네비게이션 없는 최소 레이아웃(`/me`, `/trip/*`와 분리).
- `generateMetadata({ params })` — RPC 결과 기반 OG 메타.

미들웨어 (`middleware.ts`):
- `PROTECTED_PAGES`에 `/share`가 없지만 `pathname === '/'`로 root는 보호. `/share/*`는 미보호.
- `isProtectedApi`는 `/api/*` 한정 → 영향 없음.
- 추가 작업 불필요. 다만 isAuthPage 분기에서 로그인 상태로 `/share/*`에 들어와도 차단되지 않는지 확인.
- 안전을 위해 `isProtectedPage = pathname === '/' || (PROTECTED_PAGES.some(...) && !pathname.startsWith('/share'))` 로 명시 (방어).

### 3. UI 구조

`app/share/[token]/page.tsx`가 서버 컴포넌트로 데이터를 받아서 다음에 위임:
- `<ShareHeader trip={...} itemCount={...} />` — trip 이름 + 메타 라인 + 작은 trip-planner 워터마크.
- `<SharedItemList items={...} />` — 모바일 우선 카드. 날짜별 그룹화. 편집 핸들러 없음.
- `<ShareFooterCTA />` — "직접 만들어보기" 버튼 → `/signup` 링크.

기존 `ItemCard`/`ItemList`는 편집 props와 router 의존 → 재사용 안 함. 새 `SharedItemCard` 컴포넌트를 작게 신설.

### 4. owner 측 발급 UI

- `app/trip/[tripId]/list/page.tsx` 헤더에 "공유" 버튼 추가.
- 버튼 클릭 → `ShareDialog` (Sheet 사용) 표시:
  - 활성 토큰 목록 (없으면 비어있음 안내) + "새 링크 만들기" 버튼.
  - 각 토큰: URL + "복사" + "회수".
- 컴포넌트: `components/Plan/ShareDialog.tsx` (신규).
- 데이터: `lib/share.ts`의 createShare/listSharesForTrip/revokeShare 그대로 사용.

### 5. OG 이미지

첫 단계: 기존 `/icon.svg`를 PNG로 가지지 않고, public 폴더에 정적 OG 이미지가 없다면 `og:image` 누락 가능. 본 PR에선 `og:image`는 `process.env.NEXT_PUBLIC_SITE_URL` 기반으로 사이트 메인 OG 이미지를 가리키되, 자원이 없으면 omit. **간단히 `og:image`는 선택적으로 두고 `og:title`/`og:description`만 보장**.

### 6. 회귀 방지

- 미들웨어 `/share/*` 통과 확인.
- 기존 trip 페이지 헤더에 버튼 1개 추가 외 변경 없음.

## 변경 파일

신규:
- `supabase/migration_113_get_shared_trip.sql`
- `app/share/[token]/layout.tsx`
- `app/share/[token]/page.tsx`
- `components/Share/SharedItemCard.tsx`
- `components/Share/ShareDialog.tsx`
- `lib/sharedTrip.ts` — RPC 호출 wrapper + 타입

수정:
- `middleware.ts` — `/share/*` 명시적 제외
- `app/trip/[tripId]/list/page.tsx` — "공유" 버튼 + ShareDialog 통합 (헤더 영역)
- `lib/share.ts` — 필요시 sharedTrip 타입 재사용

## 품질 게이트

- `npm run lint`
- `npm run build`
- 수동: `/share/<invalid-uuid>` → 안내 페이지, `/share/<유효 토큰>` → 데이터(마이그레이션 적용 후 가능)
