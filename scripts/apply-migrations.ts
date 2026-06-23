/**
 * Supabase 마이그레이션 러너 — Management API 기반.
 *
 * supabase/migration_*.sql 중 아직 적용되지 않은 파일을 운영 DB 에 순서대로 적용한다.
 * 적용 이력은 public.schema_migrations 테이블로 추적해 재실행을 막는다.
 *
 * 배경:
 *   기존엔 Supabase SQL Editor 에서 수동 실행해야 했고, 배포 후 누락 시 #225 처럼
 *   동선이 통째로 막히는 사고가 났다. 이 러너 + 기존 db:check(드리프트 가드) 로
 *   "마이그레이션 적용 → 검증 → 머지" 를 자동화한다.
 *
 * 필요 env (.env.local 에서 자동 로드):
 *   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
 *   SUPABASE_ACCESS_TOKEN=sbp_...   (Personal Access Token)
 *     발급: https://supabase.com/dashboard/account/tokens
 *
 * 사용:
 *   npm run db:migrate                # 미적용 마이그레이션을 순서대로 적용
 *   npm run db:migrate -- --dry-run   # 적용 대상만 출력(실행 안 함)
 *   npm run db:migrate -- --baseline  # 기존 DB 도입용: 현재 파일을 '적용됨'으로 기록만(실행 안 함)
 *   npm run db:migrate -- --help
 *
 * 안전:
 *   - 운영 DB 에 처음 도입할 땐 반드시 --baseline 을 먼저 1회 실행한다.
 *     (과거 마이그레이션이 이미 수동 적용돼 있으므로 재실행하면 안 됨)
 *   - additive 마이그레이션(add column if not exists 등)을 권장한다. 러너는 파일 SQL 을
 *     그대로 실행하므로 파괴적 구문의 책임은 작성자에게 있다.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const MIGRATIONS_DIR = join(process.cwd(), 'supabase')
const TRACKING_TABLE = 'public.schema_migrations'

function loadEnvLocal(): void {
  const path = join(process.cwd(), '.env.local')
  if (!existsSync(path)) return
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

function projectRef(url: string): string {
  // https://<ref>.supabase.co → <ref>
  const host = new URL(url).hostname
  const ref = host.split('.')[0]
  if (!ref) throw new Error(`NEXT_PUBLIC_SUPABASE_URL 에서 project ref 를 추출하지 못했습니다: ${url}`)
  return ref
}

function listMigrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^migration_.*\.sql$/.test(f))
    .sort()
}

async function runSql(ref: string, token: string, query: string): Promise<void> {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Management API ${res.status}: ${body}`)
  }
}

async function fetchAppliedNames(ref: string, token: string): Promise<Set<string>> {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `select name from ${TRACKING_TABLE} order by name;` }),
  })
  if (!res.ok) {
    throw new Error(`적용 이력 조회 실패: Management API ${res.status}: ${await res.text()}`)
  }
  const rows = (await res.json()) as { name: string }[]
  return new Set(rows.map((r) => r.name))
}

function record(name: string): string {
  // 파일명에는 따옴표가 없지만 방어적으로 escape.
  const safe = name.replace(/'/g, "''")
  return `insert into ${TRACKING_TABLE}(name) values ('${safe}') on conflict (name) do nothing;`
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.includes('-h')) {
    console.log(
      [
        'Supabase 마이그레이션 러너',
        '',
        '  npm run db:migrate                미적용 마이그레이션 적용',
        '  npm run db:migrate -- --dry-run   적용 대상만 출력',
        '  npm run db:migrate -- --baseline  현재 파일을 적용됨으로 기록만(기존 DB 도입 1회)',
        '',
        'env(.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_ACCESS_TOKEN(sbp_...)',
      ].join('\n'),
    )
    process.exit(0)
  }

  const dryRun = args.includes('--dry-run')
  const baseline = args.includes('--baseline')

  loadEnvLocal()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!url) {
    console.error('NEXT_PUBLIC_SUPABASE_URL 가 필요합니다 (.env.local).')
    process.exit(2)
  }
  if (!token) {
    console.error(
      'SUPABASE_ACCESS_TOKEN(sbp_...) 가 필요합니다.\n' +
        '발급: https://supabase.com/dashboard/account/tokens → .env.local 에 추가',
    )
    process.exit(2)
  }

  const ref = projectRef(url)
  const files = listMigrationFiles()
  if (files.length === 0) {
    console.log('적용할 마이그레이션 파일이 없습니다.')
    return
  }

  // 추적 테이블 보장 (additive, 안전).
  await runSql(
    ref,
    token,
    `create table if not exists ${TRACKING_TABLE} (name text primary key, applied_at timestamptz not null default now());`,
  )

  const applied = await fetchAppliedNames(ref, token)
  const pending = files.filter((f) => !applied.has(f))

  if (pending.length === 0) {
    console.log('[db:migrate] 모든 마이그레이션이 이미 적용됨.')
    return
  }

  if (dryRun) {
    console.log('[db:migrate] 적용 대기 (dry-run):')
    for (const f of pending) console.log('  - ' + f)
    return
  }

  if (baseline) {
    console.log('[db:migrate] --baseline: 아래 파일을 실행 없이 적용됨으로 기록합니다.')
    for (const f of pending) {
      await runSql(ref, token, record(f))
      console.log('  ✓ recorded ' + f)
    }
    console.log('[db:migrate] baseline 완료. 이후 신규 파일만 실제 적용됩니다.')
    return
  }

  console.log(`[db:migrate] ${pending.length}개 적용 시작 (project: ${ref})`)
  for (const f of pending) {
    const sql = readFileSync(join(MIGRATIONS_DIR, f), 'utf8')
    try {
      await runSql(ref, token, sql)
      await runSql(ref, token, record(f))
      console.log('  ✓ applied ' + f)
    } catch (e) {
      console.error(`  ✗ 실패 ${f}: ${(e as Error).message}`)
      console.error('중단합니다. 해당 파일을 확인 후 재실행하세요.')
      process.exit(1)
    }
  }
  console.log('[db:migrate] 완료.')
}

main().catch((e) => {
  console.error('[db:migrate] 예기치 못한 오류:', e)
  process.exit(2)
})
