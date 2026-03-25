'use client'

import { useState, useRef, useEffect } from 'react'
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

function LinkButton({ links }: { links: TripItem['links'] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (links.length === 0) return null

  if (links.length === 1) {
    return (
      <a
        href={links[0].url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-500 transition-colors"
        title={links[0].label || '링크 열기'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
        </svg>
      </a>
    )
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v) }}
        className="p-1 text-gray-400 hover:text-blue-500 transition-colors flex items-center gap-0.5"
        title="링크 목록"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
        </svg>
        <span className="text-xs">{links.length}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-36">
          {links.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => { e.stopPropagation(); setOpen(false) }}
              className="block px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 truncate max-w-48"
            >
              {link.label || link.url}
            </a>
          ))}
        </div>
      )}
    </div>
  )
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
            <LinkButton links={item.links} />
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
