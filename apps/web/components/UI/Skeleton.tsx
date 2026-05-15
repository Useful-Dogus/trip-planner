import { cn } from '@/lib/cn'

interface SkeletonProps {
  className?: string
}

/** 단일 스켈레톤 블록. 레이아웃 점프 방지용. */
export function Skeleton({ className }: SkeletonProps) {
  return <span className={cn('block skeleton rounded', className)} aria-hidden="true" />
}

/** 카드 형태 스켈레톤 (사이드패널 리스트용). */
export function SkeletonCard() {
  return (
    <div
      className="flex items-start gap-3 p-4 border border-border rounded-lg bg-bg-elevated"
      aria-hidden="true"
    >
      <Skeleton className="size-9 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="불러오는 중">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
