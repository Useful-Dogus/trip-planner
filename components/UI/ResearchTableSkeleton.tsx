export default function ResearchTableSkeleton() {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden animate-pulse">
      {/* 헤더 */}
      <div className="flex items-center border-b border-gray-200 bg-white px-3 py-2.5 gap-4">
        <div className="h-3 bg-gray-200 rounded w-8" />
        <div className="h-3 bg-gray-100 rounded w-6 ml-auto" />
        <div className="h-3 bg-gray-100 rounded w-14" />
        <div className="h-3 bg-gray-100 rounded w-14" />
        <div className="h-3 bg-gray-100 rounded w-10" />
      </div>
      {/* 행 */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center border-b border-gray-100 px-3 py-3 gap-4">
          <div className="flex-1 h-3.5 bg-gray-200 rounded" style={{ width: `${40 + (i * 17) % 45}%` }} />
          <div className="w-10 flex justify-center">
            <div className="w-5 h-5 bg-gray-100 rounded" />
          </div>
          <div className="w-28">
            <div className="h-5 bg-gray-100 rounded-full w-20" />
          </div>
          <div className="w-28">
            <div className="h-5 bg-gray-100 rounded-full w-16" />
          </div>
          <div className="w-24 flex justify-end">
            <div className="h-3 bg-gray-100 rounded w-10" />
          </div>
          <div className="w-8" />
        </div>
      ))}
    </div>
  )
}
