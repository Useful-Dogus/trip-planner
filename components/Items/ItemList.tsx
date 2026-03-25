'use client'

import { useState, useMemo } from 'react'
import type { TripItem, Category, Status, Priority } from '@/types'
import ItemCard from './ItemCard'

const CATEGORIES: Category[] = ['교통', '숙소', '식당', '카페', '관광', '공연', '스포츠', '쇼핑', '기타']
const STATUSES: Status[] = ['검토중', '보류', '대기중', '확정', '탈락']
const PRIORITIES: Priority[] = ['반드시', '들를만해', '시간 남으면']

type SortKey = 'name' | 'date' | 'budget' | 'priority'
type SortDir = 'asc' | 'desc'

const PRIORITY_ORDER: Record<string, number> = { '반드시': 0, '들를만해': 1, '시간 남으면': 2 }

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
  const [showEliminated, setShowEliminated] = useState(false)
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const eliminatedCount = useMemo(() => items.filter(i => i.status === '탈락').length, [items])

  function handleSortChange(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const result = items.filter(item => {
      if (!showEliminated && item.status === '탈락') return false
      if (selCats.length && !selCats.includes(item.category)) return false
      if (selStatuses.length && !selStatuses.includes(item.status)) return false
      if (selPriorities.length) {
        if (!item.priority || !selPriorities.includes(item.priority)) return false
      }
      if (q && !item.name.toLowerCase().includes(q)) return false
      return true
    })

    result.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') {
        cmp = a.name.localeCompare(b.name, 'ko')
      } else if (sortKey === 'date') {
        const da = a.date ?? ''
        const db = b.date ?? ''
        cmp = da < db ? -1 : da > db ? 1 : 0
      } else if (sortKey === 'budget') {
        cmp = (a.budget ?? 0) - (b.budget ?? 0)
      } else if (sortKey === 'priority') {
        const pa = a.priority ? PRIORITY_ORDER[a.priority] : 99
        const pb = b.priority ? PRIORITY_ORDER[b.priority] : 99
        cmp = pa - pb
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [items, selCats, selStatuses, selPriorities, showEliminated, query, sortKey, sortDir])

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'name', label: '이름' },
    { key: 'date', label: '날짜' },
    { key: 'budget', label: '예산' },
    { key: 'priority', label: '우선순위' },
  ]

  return (
    <div className="space-y-4">
      {/* 검색 */}
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="이름으로 검색..."
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
      />

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

      {/* 정렬 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-gray-400">정렬:</span>
        {SORT_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleSortChange(key)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              sortKey === key
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            {label}
            {sortKey === key && (
              <span className="ml-0.5">{sortDir === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{filtered.length}개 항목</p>
        {eliminatedCount > 0 && (
          <button
            onClick={() => setShowEliminated(v => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
          >
            {showEliminated ? `탈락 항목 숨기기` : `탈락 항목 보기 (${eliminatedCount})`}
          </button>
        )}
      </div>

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
