import Link from 'next/link'
import type { TripItem, Category } from '@/types'
import StatusBadge from '@/components/UI/StatusBadge'
import PriorityBadge from '@/components/UI/PriorityBadge'

const categoryColors: Record<Category, string> = {
  교통: '#94A3B8',
  숙소: '#7DD3FC',
  식당: '#FB923C',
  관광: '#6EE7B7',
  쇼핑: '#C4B5FD',
  기타: '#FCD34D',
}

export default function ItemCard({ item }: { item: TripItem }) {
  return (
    <Link href={`/items/${item.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: categoryColors[item.category] }}
            />
            <span className="font-medium text-gray-900 truncate text-sm">{item.name}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
            <StatusBadge status={item.status} />
            {item.priority && <PriorityBadge priority={item.priority} />}
          </div>
        </div>

        {(item.date || item.time_start || item.budget !== undefined) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400 pl-[18px]">
            {item.date && <span>{item.date}</span>}
            {item.time_start && <span>{item.time_start}</span>}
            {item.budget !== undefined && <span>${item.budget}</span>}
          </div>
        )}
      </div>
    </Link>
  )
}
