'use client'

import { useEffect, useState } from 'react'
import Sheet from '@/components/UI/Sheet'
import Button from '@/components/UI/Button'
import { Input } from '@/components/UI/Input'
import { useToast } from '@/components/UI/Toast'
import type { TripItem } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  items: TripItem[]
  onUpdateItem: (id: string, changes: Record<string, unknown>) => Promise<unknown> | unknown
  /** 일괄 저장 — 옵티미스틱 1회 + 병렬 PATCH + revalidate 1회로 stagger 없이 수렴(#298). */
  onUpdateItems: (
    updates: { id: string; changes: Record<string, unknown> }[],
  ) => Promise<{ okIds: string[]; failedIds: string[] }>
}

interface RowState {
  draft: string
  suggestion: string | null
  loading: boolean
  saved: boolean
  error: string | null
}

const UNNAMED_PREFIX = '📍'

/**
 * Gmaps import 이후 `📍` prefix 가 붙은 좌표만 가진 항목을 모아 한 시트에서 명명.
 * 각 행: reverse geocode 후보 (선택 시 입력에 적용) + 직접 입력 + 개별 저장.
 */
export default function UnnamedBulkEditDialog({ open, onClose, items, onUpdateItem, onUpdateItems }: Props) {
  const { showToast } = useToast()
  const [rows, setRows] = useState<Record<string, RowState>>({})
  const [savingAll, setSavingAll] = useState(false)

  useEffect(() => {
    if (!open) return
    const next: Record<string, RowState> = {}
    for (const it of items) {
      next[it.id] = {
        draft: '',
        suggestion: null,
        loading: false,
        saved: false,
        error: null,
      }
    }
    setRows(next)
    // 비동기로 reverse geocode 후보 prefetch
    for (const it of items) {
      if (it.lat == null || it.lng == null) continue
      void fetchSuggestion(it)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items.length])

  async function fetchSuggestion(it: TripItem) {
    if (it.lat == null || it.lng == null) return
    setRows((prev) => ({
      ...prev,
      [it.id]: { ...prev[it.id], loading: true },
    }))
    try {
      const res = await fetch(`/api/geocode?lat=${it.lat}&lng=${it.lng}`)
      const data = (await res.json()) as { address?: string | null }
      setRows((prev) => ({
        ...prev,
        [it.id]: {
          ...prev[it.id],
          suggestion: data.address ?? null,
          loading: false,
        },
      }))
    } catch {
      setRows((prev) => ({
        ...prev,
        [it.id]: { ...prev[it.id], loading: false },
      }))
    }
  }

  async function saveOne(id: string, name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    setRows((prev) => ({
      ...prev,
      [id]: { ...prev[id], error: null },
    }))
    try {
      await onUpdateItem(id, { name: trimmed })
      setRows((prev) => ({
        ...prev,
        [id]: { ...prev[id], saved: true },
      }))
    } catch {
      setRows((prev) => ({
        ...prev,
        [id]: { ...prev[id], error: '저장 실패' },
      }))
    }
  }

  async function handleSaveAll() {
    setSavingAll(true)
    const updates = items
      .filter((it) => {
        const row = rows[it.id]
        return row && !row.saved && row.draft.trim().length > 0
      })
      .map((it) => ({ id: it.id, changes: { name: rows[it.id].draft.trim() } }))

    // 개별 N회 저장 대신 일괄 처리 — 옵티미스틱 1회 + revalidate 1회로 항목이
    // "하나씩" 사라지는 stagger 없이 한 번에 정리된다(#298).
    const { okIds, failedIds } = await onUpdateItems(updates)

    setRows((prev) => {
      const next = { ...prev }
      for (const id of okIds) next[id] = { ...next[id], saved: true, error: null }
      for (const id of failedIds) next[id] = { ...next[id], error: '저장 실패' }
      return next
    })
    setSavingAll(false)
    if (okIds.length > 0) showToast({ type: 'success', message: `${okIds.length}개 저장했어요` })
    else if (failedIds.length > 0) showToast({ type: 'error', message: '저장에 실패했어요' })
  }

  const pending = items.filter((it) => !rows[it.id]?.saved)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="auto"
      title={`이름 미정 ${items.length}개 — 일괄 편집`}
      description="좌표만 있는 항목을 한 화면에서 이름 지정해요. 후보를 누르면 입력칸에 채워져요."
      maxBottomHeightVh={90}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>닫기</Button>
          <Button
            variant="primary"
            onClick={handleSaveAll}
            loading={savingAll}
            disabled={pending.length === 0}
          >
            입력한 항목 모두 저장
          </Button>
        </>
      }
    >
      <div className="px-5 py-4 space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-fg-muted">이름 미정 항목이 없어요.</p>
        )}
        {items.map((it) => {
          const row = rows[it.id]
          if (!row) return null
          const coordText =
            it.lat != null && it.lng != null
              ? `${it.lat.toFixed(5)}, ${it.lng.toFixed(5)}`
              : '좌표 없음'
          return (
            <div
              key={it.id}
              className={`border border-border rounded-lg p-3 space-y-2 ${
                row.saved ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-fg-subtle font-mono">{coordText}</p>
                <p className="text-[11px] text-fg-subtle truncate" title={it.name}>
                  현재: {it.name}
                </p>
              </div>

              {row.loading ? (
                <p className="text-xs text-fg-subtle">후보 찾는 중…</p>
              ) : row.suggestion ? (
                <button
                  type="button"
                  onClick={() =>
                    setRows((prev) => ({
                      ...prev,
                      [it.id]: { ...prev[it.id], draft: row.suggestion ?? '' },
                    }))
                  }
                  className="w-full text-left text-xs px-2 py-1.5 rounded border border-border bg-bg-subtle hover:bg-border text-fg-muted truncate"
                  title={row.suggestion}
                  disabled={row.saved}
                >
                  후보: {row.suggestion}
                </button>
              ) : (
                <p className="text-xs text-fg-subtle">후보 없음 — 직접 입력하세요.</p>
              )}

              <div className="flex items-center gap-2">
                <Input
                  hideLabel
                  label="이름"
                  value={row.draft}
                  onChange={(e) =>
                    setRows((prev) => ({
                      ...prev,
                      [it.id]: { ...prev[it.id], draft: e.target.value, error: null },
                    }))
                  }
                  placeholder="장소 이름"
                  disabled={row.saved}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => saveOne(it.id, row.draft)}
                  disabled={row.saved || !row.draft.trim()}
                >
                  {row.saved ? '저장됨' : '저장'}
                </Button>
              </div>
              {row.error && (
                <p className="text-xs text-critical-fg">{row.error}</p>
              )}
            </div>
          )
        })}
      </div>
    </Sheet>
  )
}

export function countUnnamed(items: TripItem[]): number {
  return items.filter((it) => it.name.startsWith(UNNAMED_PREFIX)).length
}

export function filterUnnamed(items: TripItem[]): TripItem[] {
  return items.filter((it) => it.name.startsWith(UNNAMED_PREFIX))
}
