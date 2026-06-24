import { Skeleton } from './Skeleton'

/**
 * 실물 ResearchTable 과 동일한 고정폭 컬럼(이름 flex-1 · 분류 w-10 · 우선순위 w-28 ·
 * 예약상태 w-28 · 예산 w-24 · 액션 w-8)과 rounded-xl · bg-bg-elevated 헤더에 정렬.
 * 컬럼 정렬이 실물과 일치해 로드 후 가로 흔들림이 없다.
 */
export default function ResearchTableSkeleton() {
  return (
    <div className="border border-border rounded-xl overflow-hidden" aria-hidden="true">
      {/* 헤더 — 실물 컬럼 폭/패딩에 정렬 */}
      <div className="flex items-center border-b border-border bg-bg-elevated">
        <div className="flex-1 min-w-0 px-3 py-2.5">
          <Skeleton className="h-3 w-10" />
        </div>
        <div className="w-10 flex-shrink-0 px-2 py-2.5 flex justify-center">
          <Skeleton className="h-3 w-6" />
        </div>
        <div className="w-28 flex-shrink-0 px-2 py-2.5">
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="w-28 flex-shrink-0 px-2 py-2.5">
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="w-24 flex-shrink-0 px-3 py-2.5 flex justify-end">
          <Skeleton className="h-3 w-8" />
        </div>
        <div className="w-8 flex-shrink-0" />
      </div>
      {/* 행 */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center border-b border-border last:border-b-0"
        >
          <div className="flex-1 min-w-0 px-3 py-2.5">
            <Skeleton className="h-3.5 w-3/4" />
          </div>
          <div className="w-10 flex-shrink-0 px-2 py-2.5 flex justify-center">
            <Skeleton className="size-4 rounded" />
          </div>
          <div className="w-28 flex-shrink-0 px-2 py-2.5">
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="w-28 flex-shrink-0 px-2 py-2.5">
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="w-24 flex-shrink-0 px-3 py-2.5 flex justify-end">
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="w-8 flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}
