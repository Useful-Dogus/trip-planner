import { Skeleton } from '@/components/UI/Skeleton'

/**
 * trip 진입 시 layout (Supabase 접근 체크 + 메타 조회) 응답까지의 skeleton.
 * pathname 자체가 바뀌었으니 이전 페이지가 그대로 남는 인상을 막는다 (#233).
 */
export default function TripLoading() {
  return (
    <div className="min-h-screen bg-bg text-fg pb-24 md:pb-0 md:pl-44" aria-busy="true">
      <header className="px-4 md:px-8 pt-4">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </header>
      <main className="px-4 md:px-8 py-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-4 border border-border rounded-lg bg-bg-elevated"
          >
            <Skeleton className="size-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
