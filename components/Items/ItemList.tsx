'use client'

import { useState, useMemo } from 'react'
import type { TripItem, Category, Status, Priority } from '@/types'
import ItemCard from './ItemCard'

const CATEGORIES: Category[] = ['교통', '숙소', '식당', '카페', '관광', '공연', '스포츠', '쇼핑', '기타']
const STATUSES: Status[] = ['검토중', '보류', '대기중', '확정', '탈락']
const PRIORITIES: Priority[] = ['반드시', '들를만해', '시간 남으면']

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
        active
          ? 'bg-gray-900 text-white border-gray-900'
          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
      }`}
    >
      {label}
    </button>
  )
}

export default function ItemList({ items }: { items: TripItem[] }) {
  const [selCats, setSelCats] = useState<Category[]>([])
  const [selStatuses, setSelStatuses] = useState<Status[]>([])
  const [selPriorities, setSelPriorities] = useState<Priority[]>([])

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (selCats.length && !selCats.includes(item.category)) return false
      if (selStatuses.length && !selStatuses.includes(item.status)) return false
      if (selPriorities.length) {
        if (!item.priority || !selPriorities.includes(item.priority)) return false
      }
      return true
    })
  }, [items, selCats, selStatuses, selPriorities])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(c => (
            <Chip
              key={c}
              label={c}
              active={selCats.includes(c)}
              onClick={() => setSelCats(toggle(selCats, c))}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map(s => (
            <Chip
              key={s}
              label={s}
              active={selStatuses.includes(s)}
              onClick={() => setSelStatuses(toggle(selStatuses, s))}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRIORITIES.map(p => (
            <Chip
              key={p}
              label={p}
              active={selPriorities.includes(p)}
              onClick={() => setSelPriorities(toggle(selPriorities, p))}
            />
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400">{filtered.length}개 항목</p>

      <div className="space-y-2">
        {filtered.map(item => (
          <ItemCard key={item.id} item={item} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-12 text-sm">항목이 없습니다.</p>
        )}
      </div>
    </div>
  )
}
