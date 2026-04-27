'use client'

import type { ImportCandidate } from '@/types'

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
  const selectedCount = candidates.filter(c => c.selected).length

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
          className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {importing ? '추가 중...' : `${selectedCount}개 추가`}
        </button>
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

      {/* 목록 */}
      <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
        {candidates.map((candidate, i) => (
          <div
            key={`${candidate.place.name}-${i}`}
            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
              candidate.status === 'duplicate'
                ? 'border-border bg-gray-50 opacity-60'
                : candidate.selected
                ? 'border-border bg-white'
                : 'border-border bg-gray-50'
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
                <span
                  className={`text-sm font-medium ${
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
                <span className="text-xs text-fg-subtle bg-bg-subtle px-1.5 py-0.5 rounded">
                  {candidate.mappedCategory}
                </span>
              </div>

              {candidate.place.address && (
                <p className="text-xs text-fg-subtle mt-0.5 truncate">
                  {candidate.place.address}
                </p>
              )}

              {candidate.status === 'similar' && candidate.similarItem && (
                <p className="text-xs text-yellow-600 mt-0.5">
                  유사 장소: {candidate.similarItem.name}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
