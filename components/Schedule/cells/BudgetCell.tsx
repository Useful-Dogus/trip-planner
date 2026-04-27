'use client'

import { useEffect, useRef, useState } from 'react'

interface BudgetCellProps {
  value: number | undefined
  isEditing: boolean
  onClick: () => void
  onBlur: (value: number | undefined) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, currentValue: string) => void
}

export default function BudgetCell({ value, isEditing, onClick, onBlur, onKeyDown }: BudgetCellProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(value !== undefined ? String(value) : '')

  useEffect(() => {
    if (isEditing) {
      setDraft(value !== undefined ? String(value) : '')
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [isEditing]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isEditing) {
      setDraft(value !== undefined ? String(value) : '')
    }
  }, [value, isEditing])

  function handleBlur() {
    if (draft === '') {
      onBlur(undefined)
    } else {
      const parsed = Number(draft.replace(/[^0-9]/g, ''))
      onBlur(isNaN(parsed) ? undefined : parsed)
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
        placeholder="0"
        inputMode="numeric"
        className="w-20 bg-transparent border-b border-border-strong focus:border-accent outline-none text-sm text-right text-fg py-0.5"
        style={{ fontSize: 16 }}
      />
    )
  }

  return (
    <span
      className="text-sm text-fg-muted cursor-pointer tabular-nums select-none text-right block"
      onClick={onClick}
    >
      {value !== undefined ? (
        `$${value.toLocaleString()}`
      ) : (
        <span className="text-fg-subtle">—</span>
      )}
    </span>
  )
}
