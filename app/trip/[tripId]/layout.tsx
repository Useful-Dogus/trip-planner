import { redirect } from 'next/navigation'
import { TripProvider, type TripRole } from '@/lib/hooks/useTripContext'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'
import TripAccessDenied from '@/components/UI/TripAccessDenied'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// 브라우저 탭·공유 미리보기에 "지금 보고 있는 여행" 을 표시(Basics-First #1 컨텍스트).
// 루트 template("%s · Waypost") 가 적용돼 "도쿄 여행 · Waypost" 가 된다.
export async function generateMetadata({ params }: { params: { tripId: string } }) {
  if (!UUID_RE.test(params.tripId)) return {}
  try {
    const client = createRouteHandlerSupabase()
    const { data } = await client
      .from('trips')
      .select('title')
      .eq('id', params.tripId)
      .maybeSingle<{ title: string }>()
    if (data?.title) return { title: data.title }
  } catch {
    /* 메타데이터는 보조 정보 — 실패해도 페이지 렌더에 영향 없음 */
  }
  return {}
}

// PostgreSQL "undefined_column" — 운영 DB 에 마이그레이션이 적용되지 않은 경우 등.
// 권한 문제가 아니므로 forbidden 으로 처리하지 않는다.
const PG_UNDEFINED_COLUMN = '42703'

type AccessRow = {
  id: string
  title: string
  trip_members: { role: TripRole }[]
}

type ExtendedRow = {
  start_date: string | null
  end_date: string | null
  region: string | null
  basecamp_address: string | null
  center_lat: number | null
  center_lng: number | null
  default_zoom: number | null
  center_source: 'auto' | 'manual' | null
  currency: string | null
  home_currency: string | null
  home_currency_rate: number | null
}

const EXTENDED_COLUMNS =
  'start_date, end_date, region, basecamp_address, center_lat, center_lng, default_zoom, center_source, currency, home_currency, home_currency_rate'

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { tripId: string }
}) {
  const { tripId } = params

  if (!UUID_RE.test(tripId)) {
    return <TripAccessDenied reason="not-found" />
  }

  const client = createRouteHandlerSupabase()
  const { data: userData } = await client.auth.getUser()
  if (!userData.user) {
    redirect(`/login?next=${encodeURIComponent(`/trip/${tripId}`)}`)
  }

  // #234 — trip 진입 TTFB 최적화. 두 쿼리는 같은 trips 행을 읽을 뿐 데이터 의존성이 없으므로
  // 순차 await 대신 병렬로 실행해 DB 왕복 1회를 제거한다. 스키마 드리프트 격리를 위해
  // 쿼리 자체는 안정 컬럼(access) / 확장 컬럼(meta) 으로 분리한 상태를 유지한다.
  //  - Stage A: 접근 체크. 스키마 진화에 영향받지 않는 안정 컬럼만 사용한다.
  //    스키마 드리프트(예: 신규 컬럼 마이그레이션 누락) 가 권한 거부로 오인되는 것을 막는다.
  //  - Stage B: 메타데이터. 컬럼 누락(42703) 은 권한 문제가 아니므로 기본값으로 폴백한다.
  //    그래야 deploy-vs-DB 마이그레이션 시차에서도 사용자가 여행에 진입은 할 수 있다.
  //    비멤버의 경우 RLS 로 빈 결과가 돌아오고, access 게이트 통과 전에는 사용하지 않으므로 안전.
  const [access, meta] = await Promise.all([
    client
      .from('trips')
      .select('id, title, trip_members!inner(role)')
      .eq('id', tripId)
      .eq('trip_members.user_id', userData.user.id)
      .maybeSingle<AccessRow>(),
    client
      .from('trips')
      .select(EXTENDED_COLUMNS)
      .eq('id', tripId)
      .maybeSingle<ExtendedRow>(),
  ])

  if (access.error) {
    console.error('[TripLayout] access check failed', {
      tripId,
      userId: userData.user.id,
      code: access.error.code,
      message: access.error.message,
      details: access.error.details,
      hint: access.error.hint,
    })
    return <TripAccessDenied reason="server-error" />
  }
  if (!access.data) {
    return <TripAccessDenied reason="forbidden" />
  }
  const role = access.data.trip_members[0]?.role
  if (!role) {
    return <TripAccessDenied reason="forbidden" />
  }

  // 메타데이터 결과 적용 — 위 Promise.all 에서 함께 fetch 됨.
  let extended: ExtendedRow = {
    start_date: null,
    end_date: null,
    region: null,
    basecamp_address: null,
    center_lat: null,
    center_lng: null,
    default_zoom: null,
    center_source: null,
    currency: null,
    home_currency: null,
    home_currency_rate: null,
  }
  if (meta.error) {
    if (meta.error.code === PG_UNDEFINED_COLUMN) {
      console.error('[TripLayout] schema drift detected — extended columns missing. 운영 DB 마이그레이션 누락 가능.', {
        tripId,
        code: meta.error.code,
        message: meta.error.message,
      })
    } else {
      console.error('[TripLayout] meta fetch failed', {
        tripId,
        code: meta.error.code,
        message: meta.error.message,
      })
    }
  } else if (meta.data) {
    extended = meta.data
  }

  return (
    <TripProvider
      value={{
        id: access.data.id,
        title: access.data.title,
        startDate: extended.start_date,
        endDate: extended.end_date,
        region: extended.region,
        basecampAddress: extended.basecamp_address,
        centerLat: extended.center_lat,
        centerLng: extended.center_lng,
        defaultZoom: extended.default_zoom,
        centerSource: extended.center_source,
        currency: extended.currency ?? 'KRW',
        homeCurrency: extended.home_currency,
        homeCurrencyRate: extended.home_currency_rate,
        role,
      }}
    >
      {children}
    </TripProvider>
  )
}
