'use client'

import { useEffect, useRef, useState } from 'react'
import type { TripItem } from '@/types'
import StatusBadge from '@/components/UI/StatusBadge'
import PriorityBadge from '@/components/UI/PriorityBadge'
import PanelItemForm from './PanelItemForm'

export interface ItemPanelProps {
  item: TripItem | null
  isOpen: boolean
  onClose: () => void
  onSave: (updated: TripItem) => void
  onDelete: (id: string) => void
}

export default function ItemPanel({ item, isOpen, onClose, onSave, onDelete }: ItemPanelProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const panelRef = useRef<HTMLDivElement>(null)

  // 항목이 바뀌면 항상 읽기 모드로 리셋
  useEffect(() => {
    setMode('view')
  }, [item?.id])

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // 스와이프 다운으로 닫기 (모바일)
  const touchStartY = useRef<number>(0)
  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (delta > 50) onClose()
  }

  // 패널이 닫혀도 마지막 item은 캐싱 (애니메이션 중 콘텐츠 유지)
  const cachedItem = useRef<TripItem | null>(null)
  if (item) cachedItem.current = item
  const displayItem = item ?? cachedItem.current

  return (
    <>
      {/* 백드롭 */}
      <div
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 패널: 데스크탑 사이드 패널 / 모바일 바텀 시트 */}
      <div
        ref={panelRef}
        aria-label="항목 상세 패널"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`
          fixed z-50 bg-white shadow-2xl transition-transform duration-300 ease-in-out
          flex flex-col
          bottom-0 left-0 right-0 rounded-t-2xl max-h-[88vh]
          md:bottom-auto md:right-0 md:top-0 md:left-auto md:w-[440px] md:h-full md:rounded-none md:rounded-l-2xl
          ${isOpen
            ? 'translate-y-0 md:translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-y-0 md:translate-x-full'
          }
        `}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          {/* 모바일 드래그 핸들 */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full md:hidden" />

          <span className="text-sm font-semibold text-gray-900">
            {mode === 'edit' ? '편집' : '상세 정보'}
          </span>
          <div className="flex items-center gap-2">
            {mode === 'view' && displayItem && (
              <button
                onClick={() => setMode('edit')}
                className="px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                편집
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="패널 닫기"
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto">
          {displayItem && mode === 'view' && <ItemDetailView item={displayItem} />}
          {displayItem && mode === 'edit' && (
            <PanelItemForm
              item={displayItem}
              onSave={updated => {
                onSave(updated)
                setMode('view')
              }}
              onCancel={() => setMode('view')}
              onDelete={id => {
                onDelete(id)
                onClose()
              }}
            />
          )}
        </div>
      </div>
    </>
  )
}

function ItemDetailView({ item }: { item: TripItem }) {
  return (
    <div className="px-5 py-4 space-y-5 pb-8">
      {/* 이름 + 배지 */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
            {item.category}
          </span>
          <StatusBadge status={item.status} />
          {item.priority && <PriorityBadge priority={item.priority} />}
        </div>
      </div>

      {/* 일정 & 예산 */}
      {(item.date || item.time_start || item.budget !== undefined) && (
        <section className="bg-gray-50 rounded-xl p-4 space-y-1.5">
          {item.date && <DetailRow label="날짜" value={item.date} />}
          {item.time_start && <DetailRow label="시작 시간" value={item.time_start} />}
          {item.budget !== undefined && (
            <DetailRow label="예산" value={`$${item.budget.toLocaleString()}`} />
          )}
        </section>
      )}

      {/* 위치 */}
      {item.address && (
        <section>
          <SectionTitle>위치</SectionTitle>
          <p className="text-sm text-gray-700">{item.address}</p>
          {item.lat !== undefined && item.lng !== undefined && (
            <p className="text-xs text-gray-400 mt-1">
              {item.lat}, {item.lng}
            </p>
          )}
        </section>
      )}

      {/* 링크 */}
      {item.links.length > 0 && (
        <section>
          <SectionTitle>링크</SectionTitle>
          <div className="space-y-1.5">
            {item.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
                {link.label || link.url}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* 메모 */}
      {item.memo && (
        <section>
          <SectionTitle>메모</SectionTitle>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.memo}</p>
        </section>
      )}

      {/* 지점 (프랜차이즈) */}
      {item.is_franchise && item.branches && item.branches.length > 0 && (
        <section>
          <SectionTitle>지점 ({item.branches.length})</SectionTitle>
          <div className="space-y-2">
            {item.branches.map(branch => (
              <div key={branch.id} className="flex items-start gap-2 bg-gray-50 rounded-lg p-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-xs font-medium text-gray-700">{branch.name}</p>
                  {branch.address && <p className="text-xs text-gray-400">{branch.address}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
      {children}
    </h3>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}
