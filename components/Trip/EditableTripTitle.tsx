'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal } from 'lucide-react'
import { useTrip } from '@/lib/hooks/useTripContext'
import { useToast } from '@/components/UI/Toast'
import IconButton from '@/components/UI/IconButton'
import TripSettingsSheet from './TripSettingsSheet'

function canEdit(role: 'owner' | 'editor' | 'viewer'): boolean {
  return role === 'owner' || role === 'editor'
}

function formatRange(start: string | null, end: string | null): string | null {
  if (start && end) return `${start} - ${end}`
  return start ?? end
}

/**
 * Trip 페이지 공통 헤더 타이틀.
 * - section: 현재 페이지명 (목록/지도/일정 등)
 * - title 영역 클릭 → 인라인 편집 (owner/editor only)
 * - ⋯ 버튼 → 여행 설정 시트
 */
export default function EditableTripTitle({ section }: { section: string }) {
  const trip = useTrip()
  const router = useRouter()
  const { showToast } = useToast()
  const editable = canEdit(trip.role)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(trip.title)
  const [saving, setSaving] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setDraft(trip.title)
  }, [trip.title])

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  async function commit() {
    const next = draft.trim()
    if (!next || next === trip.title) {
      setEditing(false)
      setDraft(trip.title)
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/trips/${trip.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: next }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast({ message: data?.error ?? '저장에 실패했습니다.', type: 'error' })
        setDraft(trip.title)
      } else {
        showToast({ message: '제목을 저장했습니다.', type: 'success' })
        router.refresh()
      }
    } catch {
      showToast({ message: '네트워크 오류', type: 'error' })
      setDraft(trip.title)
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  const range = formatRange(trip.startDate, trip.endDate)

  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commit()
              } else if (e.key === 'Escape') {
                setDraft(trip.title)
                setEditing(false)
              }
            }}
            disabled={saving}
            className="min-w-0 flex-1 truncate text-xs font-medium text-fg bg-bg border border-border rounded px-1.5 py-0.5 focus:outline-none focus:border-accent"
            aria-label="여행 제목"
          />
        ) : (
          <button
            type="button"
            onClick={() => editable && setEditing(true)}
            className={`truncate text-xs font-medium text-fg-subtle ${
              editable ? 'cursor-text hover:text-fg' : 'cursor-default'
            }`}
            title={editable ? '클릭하여 제목 편집' : trip.title}
            disabled={!editable}
          >
            <span className="truncate">{trip.title}</span>
            {range ? <span className="text-fg-subtle/70"> · {range}</span> : null}
          </button>
        )}
        {editable && !editing && (
          <IconButton
            aria-label="여행 설정"
            onClick={() => setSheetOpen(true)}
            size="sm"
          >
            <MoreHorizontal className="size-3.5" aria-hidden />
          </IconButton>
        )}
      </div>
      <h1 className="text-xl font-bold text-fg">{section}</h1>
      {editable && <TripSettingsSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />}
    </div>
  )
}
