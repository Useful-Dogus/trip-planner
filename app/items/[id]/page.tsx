import Link from 'next/link'
import { notFound } from 'next/navigation'
import { readItems } from '@/lib/data'
import Navigation from '@/components/Layout/Navigation'
import StatusBadge from '@/components/UI/StatusBadge'
import PriorityBadge from '@/components/UI/PriorityBadge'

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const items = await readItems()
  const item = items.find(i => i.id === params.id)

  if (!item) notFound()

  return (
    <div className="md:pl-44">
      <div className="max-w-lg mx-auto px-4 py-6 pb-28 md:pb-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/research" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← 목록
          </Link>
          <Link
            href={`/items/${item.id}/edit`}
            className="px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            편집
          </Link>
        </div>

        {/* 이름 + 배지 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{item.name}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
              {item.category}
            </span>
            <StatusBadge status={item.status} />
            {item.priority && <PriorityBadge priority={item.priority} />}
          </div>
        </div>

        <div className="space-y-5">
          {/* 일정 & 예산 */}
          {(item.date || item.time_start || item.budget !== undefined) && (
            <section className="bg-gray-50 rounded-xl p-4 space-y-1.5">
              {item.date && (
                <Row label="날짜" value={item.date} />
              )}
              {item.time_start && (
                <Row label="시작 시간" value={item.time_start} />
              )}
              {item.budget !== undefined && (
                <Row label="예산" value={`$${item.budget.toLocaleString()}`} />
              )}
            </section>
          )}

          {/* 위치 */}
          {item.address && (
            <section>
              <SectionTitle>위치</SectionTitle>
              <p className="text-sm text-gray-700">{item.address}</p>
              {item.lat !== undefined && item.lng !== undefined && (
                <p className="text-xs text-gray-400 mt-1">{item.lat}, {item.lng}</p>
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
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
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
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.memo}</p>
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
    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{children}</h2>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}
