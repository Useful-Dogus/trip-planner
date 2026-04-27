'use client'

import { useEffect, useRef, useState } from 'react'

interface TimeCellProps {
  value: string | undefined
  isEditing: boolean
  onClick: () => void
  onBlur: (value: string | undefined) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, currentValue: string) => void
}

function isValidTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value)
}

export default function TimeCell({ value, isEditing, onClick, onBlur, onKeyDown }: TimeCellProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(value ?? '')

  useEffect(() => {
    if (isEditing) {
      setDraft(value ?? '')
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [isEditing]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isEditing) {
      setDraft(value ?? '')
    }
  }, [value, isEditing])

  function handleBlur() {
    if (draft === '') {
      onBlur(undefined)
    } else if (isValidTime(draft)) {
      onBlur(draft)
    } else {
      // 잘못된 포맷이면 원래 값으로 복원
      setDraft(value ?? '')
      onBlur(value)
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={e => onKeyDown(e, draft)}
        placeholder="HH:MM"
        className="w-16 bg-transparent border-b border-border-strong focus:border-accent outline-none text-sm text-fg py-0.5"
        style={{ fontSize: 16 }}
      />
    )
  }

  return (
    <span
      className="text-sm text-fg-muted cursor-pointer tabular-nums select-none whitespace-nowrap"
      onClick={onClick}
    >
      {value || <span className="text-fg-subtle">--:--</span>}
    </span>
  )
}
