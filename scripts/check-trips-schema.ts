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
 */
import { createClient } from '@supabase/supabase-js'

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
    'decision_reason',
    'satisfaction',
    'last_entry_time',
    'reservation_deadline',
    'opening_hours',
    'closed_days',
    'created_at',
    'updated_at',
  ],
}

const PG_UNDEFINED_COLUMN = '42703'

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    console.error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 필요합니다.')
    process.exit(2)
  }

  const client = createClient(url, anon, { auth: { persistSession: false } })
  const missing: { table: string; column: string }[] = []
  const warnings: string[] = []

  for (const [table, columns] of Object.entries(REQUIRED_COLUMNS)) {
    for (const column of columns) {
      const { error } = await client.from(table).select(column).limit(0)
      if (!error) continue
      if (error.code === PG_UNDEFINED_COLUMN) {
        missing.push({ table, column })
        continue
      }
      // RLS 또는 인증 미설정으로 인한 select 거부는 컬럼 존재성 자체를 부정하지 않는다.
      // (PostgREST 는 컬럼 미존재면 명확히 42703 으로 회신한다.)
      warnings.push(`${table}.${column}: ${error.code ?? '?'} ${error.message}`)
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
