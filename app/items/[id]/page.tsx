import Link from 'next/link'
import { notFound } from 'next/navigation'
import { readItems } from '@/lib/data'
import Navigation from '@/components/Layout/Navigation'
import ItemMetadataChips from '@/components/UI/ItemMetadataChips'
import type { TripItem } from '@/types'

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const items = await readItems()
  const item = items.find(i => i.id === params.id)

  if (!item) notFound()
  const scheduleRows = buildScheduleRows(item)

  return (
    <div className="md:pl-44">
      <div className="max-w-lg mx-auto px-4 py-6 pb-28 md:pb-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/research"
            className="text-sm text-fg-subtle hover:text-fg-muted transition-colors"
          >
            ← 목록
          </Link>
          <Link
            href={`/items/${item.id}/edit`}
            className="px-3 py-1.5 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
          >
            편집
          </Link>
        </div>

        {/* 이름 + 배지 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-fg mb-2">{item.name}</h1>
          <ItemMetadataChips item={item} />
        </div>

        <div className="space-y-5">
          {/* 일정 & 예산 */}
          {(scheduleRows.length > 0 || item.budget !== undefined) && (
            <section className="bg-gray-50 rounded-xl p-4 space-y-1.5">
              {scheduleRows.map(row => (
                <Row key={row.label} label={row.label} value={row.value} />
              ))}
              {item.budget !== undefined && (
                <Row label="예산" value={`$${item.budget.toLocaleString()}`} />
              )}
            </section>
          )}

          {/* 위치 */}
          {item.address && (
            <section>
              <SectionTitle>위치</SectionTitle>
              <p className="text-sm text-fg">{item.address}</p>
              {item.lat !== undefined && item.lng !== undefined && (
                <p className="text-xs text-fg-subtle mt-1">
                  {item.lat}, {item.lng}
                </p>
              )}
            </section>
          )}

          {/* 링크 */}
          {item.links.length > 0 && (
            <section>
              <SectionTitle>링크</SectionTitle>
              <div className="space-y-1.5">
                {item.links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3.5 h-3.5 flex-shrink-0"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                    {link.label || link.url}
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* 메모 */}
          {item.memo && (
            <section>
              <SectionTitle>메모</SectionTitle>
              <p className="text-sm text-fg whitespace-pre-wrap">{item.memo}</p>
            </section>
          )}
        </div>
      </div>
      <Navigation />
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-2">
      {children}
    </h2>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-fg-muted">{label}</span>
      <span className="text-sm font-medium text-fg">{value}</span>
    </div>
  )
}

function buildScheduleRows(item: TripItem): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = []
  if (item.date) rows.push({ label: '시작 날짜', value: item.date })
  if (item.time_start) rows.push({ label: '시작 시간', value: item.time_start })
  if (item.end_date) rows.push({ label: '종료 날짜', value: item.end_date })
  if (item.time_end) rows.push({ label: '종료 시간', value: item.time_end })
  return rows
}
