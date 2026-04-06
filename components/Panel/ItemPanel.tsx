'use client'

import { useEffect, useRef, useState } from 'react'
import type { Category, Priority, ReservationStatus, Status, TripItem } from '@/types'
import PanelItemForm from './PanelItemForm'
import { useItems } from '@/lib/hooks/useItems'
import ItemMetadataChips from '@/components/UI/ItemMetadataChips'
import {
  CATEGORY_OPTIONS,
  ITEM_FIELD_LABELS,
  PLACEHOLDER_LABELS,
  PLACEHOLDER_TONE,
  PRIORITY_OPTIONS,
  RESERVATION_STATUS_OPTIONS,
  STATUS_OPTIONS,
} from '@/lib/itemOptions'

export interface ItemPanelProps {
  item: TripItem | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  onDelete: (id: string) => void
}

export default function ItemPanel({ item, isOpen, onClose, onSave, onDelete }: ItemPanelProps) {
  const { deleteItem, updateItem } = useItems()
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [isDirty, setIsDirty] = useState(false)
  const [confirmingClose, setConfirmingClose] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [savingField, setSavingField] = useState<'category' | 'status' | 'reservation_status' | 'priority' | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMode('view')
    setIsDirty(false)
    setConfirmingClose(false)
    setSavingField(null)
  }, [item?.id])

  useEffect(() => {
    if (!isOpen) {
      setMode('view')
      setIsDirty(false)
      setConfirmingClose(false)
      setSavingField(null)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (confirmingClose) {
          setConfirmingClose(false)
        } else if (mode === 'edit' && isDirty) {
          setConfirmingClose(true)
        } else {
          onClose()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [confirmingClose, isDirty, isOpen, mode, onClose])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv || !isOpen) return
    const handler = () => {
      const height = window.innerHeight - vv.height - vv.offsetTop
      setKeyboardHeight(Math.max(0, height))
    }
    vv.addEventListener('resize', handler)
    vv.addEventListener('scroll', handler)
    handler()
    return () => {
      vv.removeEventListener('resize', handler)
      vv.removeEventListener('scroll', handler)
      setKeyboardHeight(0)
    }
  }, [isOpen])

  const touchStartY = useRef<number>(0)
  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (mode === 'edit') return
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (delta > 50) onClose()
  }

  function tryClose() {
    if (mode === 'edit' && isDirty) {
      setConfirmingClose(true)
    } else {
      onClose()
    }
  }

  function handleDiscardAndClose() {
    setConfirmingClose(false)
    onClose()
  }

  async function handleDelete(id: string) {
    if (!confirm('이 항목을 삭제하시겠습니까?')) return
    await deleteItem(id)
    onDelete(id)
    onClose()
  }

  async function handleQuickUpdate(field: 'category' | 'status' | 'reservation_status' | 'priority', value: string | null) {
    if (!displayItem) return
    setSavingField(field)
    await updateItem(displayItem.id, { [field]: value })
    setSavingField(null)
    onSave()
  }

  const cachedItem = useRef<TripItem | null>(null)
  if (item) cachedItem.current = item
  const displayItem = item ?? cachedItem.current

  const panelStyle: React.CSSProperties =
    keyboardHeight > 0 ? { bottom: `${keyboardHeight}px`, maxHeight: `${window.innerHeight - keyboardHeight}px` } : {}

  return (
    <>
      <div className={`fixed inset-0 bg-black/30 z-[1000] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={confirmingClose ? () => setConfirmingClose(false) : tryClose} aria-hidden="true" />

      <div
        ref={panelRef}
        aria-label="항목 상세 패널"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={panelStyle}
        className={`fixed z-[1010] bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col bottom-0 left-0 right-0 rounded-t-2xl h-[80vh] md:h-screen md:bottom-auto md:right-0 md:top-0 md:left-auto md:w-[520px] md:rounded-none md:rounded-l-2xl ${
          isOpen ? 'translate-y-0 md:translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full md:hidden" />
          <span className="text-sm font-semibold text-gray-900">{mode === 'edit' ? '편집' : '상세 정보'}</span>
          <div className="flex items-center gap-2">
            {mode === 'view' && displayItem && (
              <button onClick={() => setMode('edit')} className="px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                편집
              </button>
            )}
            {mode === 'edit' && displayItem && (
              <button onClick={() => handleDelete(displayItem.id)} aria-label="항목 삭제" className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                삭제
              </button>
            )}
            <button onClick={tryClose} aria-label="패널 닫기" className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {displayItem && mode === 'view' && <ItemDetailView item={displayItem} savingField={savingField} onQuickUpdate={handleQuickUpdate} />}
          {displayItem && mode === 'edit' && (
            <PanelItemForm
              item={displayItem}
              onSave={() => {
                onSave()
                setMode('view')
              }}
              onCancel={() => setMode('view')}
              onDirtyChange={setIsDirty}
            />
          )}
        </div>

        {confirmingClose && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-amber-100 px-5 pt-4 pb-6 z-10">
            <p className="text-sm font-medium text-gray-800 mb-3">변경사항이 있습니다. 저장하지 않고 나가시겠습니까?</p>
            <div className="flex gap-3">
              <button onClick={handleDiscardAndClose} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors">나가기</button>
              <button onClick={() => setConfirmingClose(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">계속 편집</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function ItemDetailView({
  item,
  savingField,
  onQuickUpdate,
}: {
  item: TripItem
  savingField: 'category' | 'status' | 'reservation_status' | 'priority' | null
  onQuickUpdate: (field: 'category' | 'status' | 'reservation_status' | 'priority', value: string | null) => void
}) {
  return (
    <div className="px-5 py-4 space-y-5 pb-8 overflow-y-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h2>
        <ItemMetadataChips item={item} />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle className="mb-0">빠른 편집</SectionTitle>
          {savingField && <span className="text-xs text-gray-400">저장 중...</span>}
        </div>
        <QuickSelectGroup label={ITEM_FIELD_LABELS.category} value={item.category} options={CATEGORY_OPTIONS} saving={savingField === 'category'} placeholderLabel={PLACEHOLDER_LABELS.category} onSelect={value => onQuickUpdate('category', value)} />
        <QuickSelectGroup label={ITEM_FIELD_LABELS.status} value={item.status} options={STATUS_OPTIONS} saving={savingField === 'status'} placeholderLabel={PLACEHOLDER_LABELS.status} onSelect={value => onQuickUpdate('status', value)} />
        <QuickSelectGroup label={ITEM_FIELD_LABELS.reservation_status} value={item.reservation_status ?? null} options={RESERVATION_STATUS_OPTIONS} saving={savingField === 'reservation_status'} placeholderLabel={PLACEHOLDER_LABELS.reservation_status} onSelect={value => onQuickUpdate('reservation_status', value)} />
        <QuickSelectGroup label={ITEM_FIELD_LABELS.priority} value={item.priority ?? null} options={PRIORITY_OPTIONS} saving={savingField === 'priority'} placeholderLabel={PLACEHOLDER_LABELS.priority} onSelect={value => onQuickUpdate('priority', value)} allowEmpty />
      </section>

      {(item.date || item.time_start || item.budget !== undefined) && (
        <section className="bg-gray-50 rounded-xl p-4 space-y-1.5">
          {item.date && <DetailRow label="날짜" value={item.date} />}
          {item.time_start && <DetailRow label="시작 시간" value={item.time_start} />}
          {item.budget !== undefined && <DetailRow label="예산" value={`$${item.budget.toLocaleString()}`} />}
        </section>
      )}

      {item.address && (
        <section>
          <SectionTitle>위치</SectionTitle>
          <p className="text-sm text-gray-700">{item.address}</p>
          {item.lat !== undefined && item.lng !== undefined && <p className="text-xs text-gray-400 mt-1">{item.lat}, {item.lng}</p>}
        </section>
      )}

      {item.links.length > 0 && (
        <section>
          <SectionTitle>링크</SectionTitle>
          <div className="space-y-1.5">
            {item.links.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors">
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

      {item.memo && (
        <section>
          <SectionTitle>메모</SectionTitle>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.memo}</p>
        </section>
      )}
    </div>
  )
}

function QuickSelectGroup({
  label,
  value,
  options,
  saving,
  placeholderLabel,
  onSelect,
  allowEmpty = false,
}: {
  label: string
  value: string | null
  options: string[]
  saving: boolean
  placeholderLabel: string
  onSelect: (value: string | null) => void
  allowEmpty?: boolean
}) {
  const values = allowEmpty ? [null, ...options] : options
  return (
    <section className="space-y-2">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {values.map(option => {
          const active = option === value
          return (
            <button
              key={option ?? 'empty'}
              type="button"
              disabled={saving}
              onClick={() => onSelect(option)}
              className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                active ? 'border-gray-900 bg-gray-900 text-white' : option === null ? PLACEHOLDER_TONE : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
              } ${saving ? 'cursor-wait opacity-60' : ''}`}
            >
              <div className="text-sm font-medium">{option ?? placeholderLabel}</div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function SectionTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 ${className}`}>{children}</h3>
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}
