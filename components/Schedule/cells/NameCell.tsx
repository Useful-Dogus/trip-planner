'use client'

import { useEffect, useRef, useState } from 'react'

interface NameCellProps {
  value: string
  isEditing: boolean
  onClick: () => void
  onChange: (value: string) => void
  onBlur: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, currentValue: string) => void
}

export default function NameCell({
  value,
  isEditing,
  onClick,
  onChange,
  onBlur,
  onKeyDown,
}: NameCellProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (isEditing) {
      setDraft(value)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [isEditing]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isEditing) {
      setDraft(value)
    }
  }, [value, isEditing])

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => {
          setDraft(e.target.value)
          onChange(e.target.value)
        }}
        onBlur={() => onBlur(draft)}
        onKeyDown={e => onKeyDown(e, draft)}
        className="w-full bg-transparent border-b border-gray-300 focus:border-gray-900 outline-none text-sm text-gray-900 py-0.5 min-w-0"
        placeholder="이름 입력"
        style={{ fontSize: 16 }}
      />
    )
  }

  return (
    <span
      className="text-sm text-gray-900 cursor-pointer block truncate select-none"
      onClick={onClick}
    >
      {value || <span className="text-gray-300 italic text-xs">이름 없음</span>}
    </span>
  )
}
