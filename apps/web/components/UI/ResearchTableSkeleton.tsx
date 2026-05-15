import { Skeleton } from './Skeleton'

export default function ResearchTableSkeleton() {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-bg-elevated" aria-hidden="true">
      {/* 헤더 */}
      <div className="flex items-center border-b border-border bg-bg-subtle px-3 py-2.5 gap-4">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-6 ml-auto" />
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-3 w-10" />
      </div>
      {/* 행 */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center border-b border-border last:border-b-0 px-3 py-3 gap-4"
        >
          <Skeleton
            className="flex-1 h-3.5"
            // eslint-disable-next-line react/forbid-dom-props
          />
          <div className="w-10 flex justify-center">
            <Skeleton className="size-5 rounded" />
          </div>
          <div className="w-28">
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="w-28">
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="w-24 flex justify-end">
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="w-8" />
        </div>
      ))}
    </div>
  )
}
