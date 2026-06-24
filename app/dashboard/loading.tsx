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
        {/* 실물 trip 카드(DashboardClient)와 동일 레이아웃: 제목 + 텍스트 3줄 + 우상단 메뉴.
            실물에 없는 배지 placeholder 를 두지 않아 로드 후 layout shift 가 없다. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="relative rounded-xl border border-border bg-bg-elevated p-4"
            >
              <Skeleton className="h-4 w-3/4 rounded mb-2" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-1/2 rounded" />
                <Skeleton className="h-3 w-2/3 rounded" />
                <Skeleton className="h-3 w-2/5 rounded" />
              </div>
              <Skeleton className="absolute top-3 right-3 size-8 rounded-md" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
