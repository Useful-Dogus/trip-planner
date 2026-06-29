'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { normalizeTimeInput } from '@/lib/timeInput'

interface TimeCellProps {
  value: string | undefined
  isEditing: boolean
  onClick: () => void
  onBlur: (value: string | undefined) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, currentValue: string) => void
}

export default function TimeCell({ value, isEditing, onClick, onBlur, onKeyDown }: TimeCellProps) {
  const errorId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(value ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isEditing) {
      setDraft(value ?? '')
      setError(null)
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
    const result = normalizeTimeInput(draft)
    if (result.status === 'empty') {
      onBlur(undefined)
    } else if (result.status === 'complete') {
      onBlur(result.value)
    } else {
      setError(result.message)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Tab' || e.key === 'Enter') {
      const result = normalizeTimeInput(draft)
      if (result.status === 'partial' || result.status === 'invalid') {
        e.preventDefault()
        setError(result.message)
        return
      }
      onKeyDown(e, result.value ?? '')
      return
    }
    setError(null)
    onKeyDown(e, draft)
  }

  if (isEditing) {
    return (
      <>
      <input
        ref={inputRef}
        value={draft}
        onChange={e => {
          setDraft(e.target.value)
          setError(null)
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="08:00"
        className={`w-16 bg-transparent border-b outline-none text-sm py-0.5 ${
          error ? 'border-critical-fg text-critical-fg' : 'border-border-strong focus:border-accent text-fg'
        }`}
        style={{ fontSize: 16 }}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className="mt-1 w-32 text-xs text-critical-fg">
          {error}
        </p>
      )}
      </>
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
