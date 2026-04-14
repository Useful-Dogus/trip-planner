'use client'

import { useEffect, useRef, useState } from 'react'
import type { TripItem } from '@/types'
import PanelItemForm from './PanelItemForm'
import { useItems } from '@/lib/hooks/useItems'

export interface ItemPanelProps {
  item: TripItem | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  onDelete: (id: string) => void
}

export default function ItemPanel({ item, isOpen, onClose, onSave, onDelete }: ItemPanelProps) {
  const { deleteItem } = useItems()
  const [isDirty, setIsDirty] = useState(false)
  const [confirmingClose, setConfirmingClose] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsDirty(false)
    setConfirmingClose(false)
  }, [item?.id])

  useEffect(() => {
    if (!isOpen) {
      setIsDirty(false)
      setConfirmingClose(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (confirmingClose) {
          setConfirmingClose(false)
        } else if (isDirty) {
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
  }, [confirmingClose, isDirty, isOpen, onClose])

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
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (delta > 50) tryClose()
  }

  function tryClose() {
    if (isDirty) {
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
        aria-label="항목 편집 패널"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={panelStyle}
        className={`fixed z-[1010] bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col bottom-0 left-0 right-0 rounded-t-2xl h-[80vh] md:h-screen md:bottom-auto md:right-0 md:top-0 md:left-auto md:w-[520px] md:rounded-none md:rounded-l-2xl ${
          isOpen ? 'translate-y-0 md:translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full md:hidden" />
          <span className="text-sm font-semibold text-gray-900 truncate max-w-[60%]">{displayItem?.name ?? '편집'}</span>
          <div className="flex items-center gap-2">
            {displayItem && (
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
          {displayItem && (
            <PanelItemForm
              item={displayItem}
              onSave={() => {
                onSave()
                onClose()
              }}
              onCancel={tryClose}
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
