import { Skeleton } from '@/components/UI/Skeleton'

/**
 * 대시보드 (여행 목록) SSR Supabase 조회까지의 skeleton (#233).
 */
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-bg text-fg" aria-busy="true">
      <header className="border-b border-border bg-bg-elevated">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center gap-3">
          <Skeleton className="h-5 w-32 rounded" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-bg-elevated p-5 space-y-3"
            >
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
