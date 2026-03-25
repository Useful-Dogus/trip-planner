export default function ItemCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-3 h-3 rounded-full bg-gray-200 flex-shrink-0" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3.5 bg-gray-200 rounded w-2/5" />
            <div className="h-3 bg-gray-100 rounded w-3/5" />
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <div className="h-5 w-12 bg-gray-100 rounded-full" />
        </div>
      </div>
    </div>
  )
}
