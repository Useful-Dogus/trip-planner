import { Skeleton } from './Skeleton'

/**
 * 실물 ItemCard 와 동일 레이아웃: 16px 아이콘 + 이름/주소 2줄, 우측 액션,
 * 하단 메타데이터 칩 행(mt-3 pl-[22px]). 실물에 실재하는 요소만 placeholder 로 둔다.
 */
export default function ItemCardSkeleton() {
  return (
    <div
      className="bg-bg-elevated border border-border rounded-lg p-4"
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-2 pl-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Skeleton className="size-4 rounded shrink-0" />
          <div className="min-w-0 flex-1 space-y-1">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
        <Skeleton className="h-5 w-10 rounded shrink-0" />
      </div>
      <div className="mt-3 pl-[22px] flex gap-1.5">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  )
}
