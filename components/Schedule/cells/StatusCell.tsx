'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ReservationStatus } from '@/types'
import { RESERVATION_STATUS_META, RESERVATION_STATUS_OPTIONS } from '@/lib/itemOptions'

interface StatusCellProps {
  value: ReservationStatus | null | undefined
  isEditing: boolean
  onClick: () => void
  onSelect: (value: ReservationStatus | null) => void
  onClose: () => void
}

const STATUS_DOT: Record<ReservationStatus, string> = {
  예약완료: 'bg-green-500',
  '필요(미예약)': 'bg-orange-400',
  불필요: 'bg-gray-300',
  '확인 필요': 'bg-yellow-400',
}

const STATUS_LABEL: Record<ReservationStatus, string> = {
  예약완료: '예약완료',
  '필요(미예약)': '예약필요',
  불필요: '불필요',
  '확인 필요': '확인필요',
}

export default function StatusCell({
  value,
  isEditing,
  onClick,
  onSelect,
  onClose,
}: StatusCellProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!isEditing) return

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      setPosition({ top: rect.bottom + 4, left: rect.left })
    }

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (buttonRef.current?.contains(target) || dropdownRef.current?.contains(target)) return
      onClose()
    }

    updatePosition()
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isEditing, onClose])

  useLayoutEffect(() => {
    if (!position || !dropdownRef.current) return
    const dropRect = dropdownRef.current.getBoundingClientRect()
    if (dropRect.right > window.innerWidth) {
      setPosition(prev =>
        prev ? { ...prev, left: Math.max(0, prev.left - (dropRect.right - window.innerWidth)) } : prev
      )
    }
  }, [position])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        className="flex items-center gap-1.5 cursor-pointer hover:opacity-70 transition-opacity select-none"
      >
        {value ? (
          <>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[value]}`} />
            <span className="text-xs text-gray-600 whitespace-nowrap">{STATUS_LABEL[value]}</span>
          </>
        ) : (
          <span className="w-2 h-2 rounded-full bg-gray-200 flex-shrink-0" />
        )}
      </button>

      {isEditing &&
        position &&
        createPortal(
          <div
            ref={dropdownRef}
            data-portal="true"
            className="fixed z-[1200] rounded-xl border border-gray-200 bg-white shadow-lg p-1 w-44"
            style={{ top: position.top, left: position.left }}
          >
            {RESERVATION_STATUS_OPTIONS.map(status => {
              const meta = RESERVATION_STATUS_META[status]
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => onSelect(status)}
                  className={`flex items-center gap-2 w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                    status === value ? 'bg-gray-50' : ''
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[status]}`}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800">{status}</div>
                    <div className="text-xs text-gray-400">{meta.description}</div>
                  </div>
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-gray-200 flex-shrink-0" />
              <span className="text-sm text-gray-400">없음</span>
            </button>
          </div>,
          document.body
        )}
    </>
  )
}
