/**
 * trips/items/trip_members 테이블에 코드가 요구하는 모든 컬럼이 운영 DB 에 존재하는지 검증한다.
 *
 * 배경 (#225 — 신규 동선 블로커 사고):
 *   PR #220 가 `home_currency` / `home_currency_rate` 를 app/trip/[tripId]/layout.tsx 의 select 에 추가했지만,
 *   해당 컬럼을 만드는 `migration_203_trips_home_currency.sql` 은 Supabase SQL Editor 에서 수동 실행해야 했다.
 *   배포 후 마이그레이션 실행이 누락되어 모든 trip 진입이 forbidden 으로 차단되었다.
 *
 *   본 스크립트는 그 종류의 드리프트(코드 ↔ DB) 를 CI 또는 배포 전 단계에서 잡는다.
 *
 * 사용:
 *   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... npx tsx scripts/check-trips-schema.ts
 *   또는
 *   npm run db:check
 *
 * 동작:
 *   - REQUIRED_COLUMNS 에 명시된 각 컬럼에 대해 `select <col> limit 0` 을 시도.
 *   - 컬럼 누락(PostgreSQL code 42703) 발생 시 비-0 으로 종료.
 *   - 인증 미설정 등 다른 오류는 경고만 출력하고 통과시킨다(검증 책임 분리).
 *
 * 컬럼 추가 시:
 *   코드(layout/API/Provider) 에 컬럼을 추가하는 PR 은 반드시 REQUIRED_COLUMNS 도 함께 갱신한다.
 *   드리프트 가드는 이 목록의 정확성에 의존한다.
 *
 * 구현 메모:
 *   PostgREST 에 직접 fetch 한다 (`@supabase/supabase-js` 미사용).
 *   supabase-js 의 createClient 는 RealtimeClient 를 즉시 생성하는데, Node < 22 에는
 *   네이티브 WebSocket 이 없어 "Node.js 20 detected without native WebSocket support" 로
 *   스크립트가 스키마와 무관하게 죽었다 (CI 에서 발견). 이 스크립트는 realtime 이 전혀
 *   필요 없으므로 컬럼 존재성만 PostgREST REST 엔드포인트로 확인한다. Node 18+ 의
 *   전역 fetch 만 사용 → WebSocket·추가 의존성 불필요.
 */

const REQUIRED_COLUMNS: Record<string, string[]> = {
  trips: [
    'id',
    'owner_user_id',
    'title',
    'start_date',
    'end_date',
    'region',
    'basecamp_address',
    'center_lat',
    'center_lng',
    'default_zoom',
    'center_source',
    'currency',
    'home_currency',
    'home_currency_rate',
    'created_at',
    'updated_at',
  ],
  trip_members: ['trip_id', 'user_id', 'role', 'invited_at'],
  items: [
    'id',
    'trip_id',
    'name',
    'category',
    'status',
    'links',
    'created_at',
    'updated_at',
  ],
}

const PG_UNDEFINED_COLUMN = '42703'

/**
 * PostgREST 에 `select=<col>&limit=0` 으로 컬럼 존재성만 확인한다.
 * 반환:
 *   - { ok: true }                 컬럼 존재 (200) 또는 RLS 등 비-치명 응답
 *   - { missing: true }            컬럼 미존재 (HTTP 400 + code 42703)
 *   - { warning: string }          기타 응답 (RLS 거부·네트워크 등) — 컬럼 부정 아님
 */
async function probeColumn(
  url: string,
  anon: string,
  table: string,
  column: string,
): Promise<{ ok?: true; missing?: true; warning?: string }> {
  const endpoint = `${url.replace(/\/$/, '')}/rest/v1/${encodeURIComponent(
    table,
  )}?select=${encodeURIComponent(column)}&limit=0`
  let res: Response
  try {
    res = await fetch(endpoint, {
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        Accept: 'application/json',
      },
    })
  } catch (e) {
    return { warning: `${table}.${column}: fetch 실패 — ${(e as Error).message}` }
  }

  if (res.ok) return { ok: true }

  let code: string | undefined
  let message = ''
  try {
    const body = (await res.json()) as { code?: string; message?: string }
    code = body.code
    message = body.message ?? ''
  } catch {
    // 본문 파싱 실패 — 상태코드만으로 판단
  }

  if (code === PG_UNDEFINED_COLUMN) return { missing: true }

  // RLS 거부(401/403) 또는 기타는 컬럼 존재성 자체를 부정하지 않는다.
  // (PostgREST 는 컬럼 미존재면 명확히 42703 으로 회신한다.)
  return { warning: `${table}.${column}: HTTP ${res.status} ${code ?? ''} ${message}`.trim() }
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    console.error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 필요합니다.')
    process.exit(2)
  }

  const missing: { table: string; column: string }[] = []
  const warnings: string[] = []

  for (const [table, columns] of Object.entries(REQUIRED_COLUMNS)) {
    for (const column of columns) {
      const result = await probeColumn(url, anon, table, column)
      if (result.missing) missing.push({ table, column })
      else if (result.warning) warnings.push(result.warning)
    }
  }

  if (warnings.length > 0) {
    console.warn('[check-trips-schema] 비-치명 경고 (컬럼 미존재 아님):')
    for (const w of warnings) console.warn('  - ' + w)
  }

  if (missing.length > 0) {
    console.error('[check-trips-schema] 누락된 컬럼이 있습니다:')
    for (const m of missing) console.error(`  - ${m.table}.${m.column}`)
    console.error('운영 DB 에 다음 마이그레이션이 적용되었는지 확인하세요: supabase/*.sql')
    process.exit(1)
  }

  console.log('[check-trips-schema] OK — 코드가 요구하는 모든 컬럼이 운영 DB 에 존재합니다.')
}

main().catch((e) => {
  console.error('[check-trips-schema] 예기치 못한 오류:', e)
  process.exit(2)
})
