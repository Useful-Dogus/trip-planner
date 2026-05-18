import { Skeleton } from './Skeleton'

export default function ItemCardSkeleton() {
  return (
    <div
      className="bg-bg-elevated border border-border rounded-lg p-4"
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Skeleton className="size-3 rounded-full shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
    </div>
  )
}
