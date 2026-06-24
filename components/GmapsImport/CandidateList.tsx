'use client'

import { useState } from 'react'
import type { ImportCandidate } from '@/types'
import { isCoordinateLikeName, hasNoCoordinates } from '@/services/gmaps/placeName'

interface CandidateListProps {
  candidates: ImportCandidate[]
  onChange: (updated: ImportCandidate[]) => void
  onImport: () => void
  importing: boolean
}

const STATUS_LABEL: Record<ImportCandidate['status'], string> = {
  new: '신규',
  similar: '유사 장소',
  duplicate: '이미 추가됨',
}

const STATUS_COLOR: Record<ImportCandidate['status'], string> = {
  new: 'bg-success-bg text-success-fg',
  similar: 'bg-warning-bg text-warning-fg',
  duplicate: 'bg-bg-subtle text-fg-muted',
}

export default function CandidateList({
  candidates,
  onChange,
  onImport,
  importing,
}: CandidateListProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const selectedCount = candidates.filter(c => c.selected).length

  // 확정 전 요약(#323): 무엇을 가져오게 되는지 미리 인지하고 수정/제외하도록.
  const summary = {
    total: candidates.length,
    duplicate: candidates.filter(c => c.status === 'duplicate').length,
    unnamed: candidates.filter(c => isCoordinateLikeName(c.place.name)).length,
    noCoord: candidates.filter(c => hasNoCoordinates(c.place)).length,
  }

  function toggleAll(checked: boolean) {
    onChange(
      candidates.map(c =>
        c.status === 'duplicate' ? c : { ...c, selected: checked }
      )
    )
  }

  function toggleItem(index: number) {
    if (candidates[index].status === 'duplicate') return
    const updated = [...candidates]
    updated[index] = { ...updated[index], selected: !updated[index].selected }
    onChange(updated)
  }

  function renameItem(index: number, name: string) {
    const updated = [...candidates]
    updated[index] = {
      ...updated[index],
      place: { ...updated[index].place, name },
    }
    onChange(updated)
  }

  const allSelectable = candidates.filter(c => c.status !== 'duplicate')
  const allSelected = allSelectable.length > 0 && allSelectable.every(c => c.selected)

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-fg">
            장소 목록 검토
          </h2>
          <span className="text-sm text-fg-muted">
            {candidates.length}개 중 {selectedCount}개 선택
          </span>
        </div>
        <button
          onClick={onImport}
          disabled={importing || selectedCount === 0}
          className="px-4 py-2 text-sm font-medium bg-accent text-accent-fg rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {importing ? '추가 중...' : `${selectedCount}개 추가`}
        </button>
      </div>

      {/* 확정 전 요약(#323) — 가져오기 전에 손볼 거리를 한눈에 */}
      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 rounded-lg bg-bg-subtle px-3 py-2 text-xs text-fg-muted">
        <span>총 <strong className="text-fg">{summary.total}</strong>개</span>
        {summary.duplicate > 0 && (
          <span>이미 추가됨 <strong className="text-fg">{summary.duplicate}</strong></span>
        )}
        {summary.unnamed > 0 && (
          <span className="text-warning-fg">이름 미정 <strong>{summary.unnamed}</strong></span>
        )}
        {summary.noCoord > 0 && (
          <span className="text-warning-fg">좌표 없음 <strong>{summary.noCoord}</strong></span>
        )}
        {summary.unnamed === 0 && summary.noCoord === 0 && (
          <span className="text-success-fg">손볼 곳 없음</span>
        )}
      </div>

      {/* 전체 선택 */}
      {allSelectable.length > 0 && (
        <label className="flex items-center gap-2 mb-2 text-sm text-fg-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={e => toggleAll(e.target.checked)}
            className="w-4 h-4 rounded border-border-strong text-fg focus-visible:outline-accent"
          />
          전체 선택
        </label>
      )}

      {/* 목록 — 내부 스크롤 캡 제거: 페이지가 자연 스크롤하고 액션은 sticky 푸터로 고정(#299) */}
      <div className="space-y-1">
        {candidates.map((candidate, i) => {
          const unnamed = isCoordinateLikeName(candidate.place.name)
          const noCoord = hasNoCoordinates(candidate.place)
          const editing = editingIndex === i
          return (
            <div
              key={`${candidate.place.name}-${i}`}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                candidate.status === 'duplicate'
                  ? 'border-border bg-bg-subtle opacity-60'
                  : candidate.selected
                  ? 'border-border bg-bg-elevated'
                  : 'border-border bg-bg-subtle'
              }`}
            >
              <input
                type="checkbox"
                checked={candidate.selected}
                disabled={candidate.status === 'duplicate'}
                onChange={() => toggleItem(i)}
                className="mt-0.5 w-4 h-4 rounded border-border-strong text-fg focus-visible:outline-accent disabled:opacity-40 disabled:cursor-not-allowed"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {editing ? (
                    <input
                      autoFocus
                      type="text"
                      value={candidate.place.name}
                      onChange={e => renameItem(i, e.target.value)}
                      onBlur={() => setEditingIndex(null)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === 'Escape') setEditingIndex(null)
                      }}
                      placeholder="장소 이름 입력"
                      className="flex-1 min-w-0 px-2 py-1 text-sm rounded border border-border-strong bg-bg-elevated text-fg focus-visible:outline-accent"
                    />
                  ) : (
                    <>
                      <span
                        className={`text-sm font-medium break-words ${
                          candidate.status === 'duplicate' ? 'text-fg-subtle' : 'text-fg'
                        }`}
                      >
                        {candidate.place.name}
                      </span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[candidate.status]}`}
                      >
                        {STATUS_LABEL[candidate.status]}
                      </span>
                      {unnamed && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-warning-bg text-warning-fg">
                          이름 미정
                        </span>
                      )}
                      {noCoord && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-warning-bg text-warning-fg">
                          좌표 없음
                        </span>
                      )}
                      <span className="text-xs text-fg-subtle bg-bg-subtle px-1.5 py-0.5 rounded">
                        {candidate.mappedCategory}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingIndex(i)}
                        className="text-xs text-accent hover:underline"
                      >
                        이름 수정
                      </button>
                    </>
                  )}
                </div>

                {candidate.place.address && (
                  <p className="text-xs text-fg-subtle mt-0.5 break-words">
                    {candidate.place.address}
                  </p>
                )}

                {candidate.status === 'similar' && candidate.similarItem && (
                  <p className="text-xs text-warning-fg mt-0.5">
                    유사 장소: {candidate.similarItem.name}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
