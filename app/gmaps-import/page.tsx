'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Layout/Navigation'
import UrlInput from '@/components/GmapsImport/UrlInput'
import CandidateList from '@/components/GmapsImport/CandidateList'
import type { ImportCandidate } from '@/types'

type PageState = 'idle' | 'loading' | 'review' | 'importing' | 'done'

export default function GmapsImportPage() {
  const router = useRouter()
  const [state, setState] = useState<PageState>('idle')
  const [candidates, setCandidates] = useState<ImportCandidate[]>([])
  const [error, setError] = useState<string | null>(null)
  const [insertedCount, setInsertedCount] = useState(0)
  const [insertedIds, setInsertedIds] = useState<string[]>([])

  // 완료 시 전체 탭으로 자동 이동
  useEffect(() => {
    if (state !== 'done') return
    const target =
      insertedIds.length > 0
        ? `/research?imported=${insertedIds.join(',')}`
        : '/research'
    router.push(target)
  }, [state, insertedIds, router])

  async function handleUrlSubmit(url: string) {
    setState('loading')
    setError(null)

    try {
      const res = await fetch('/api/gmaps/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message ?? '장소 목록을 불러오지 못했습니다.')
        setState('idle')
        return
      }

      const fetched: ImportCandidate[] = data.candidates ?? []

      if (fetched.length === 0) {
        setError('리스트에 장소가 없습니다.')
        setState('idle')
        return
      }

      setCandidates(fetched)
      setState('review')
    } catch {
      setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      setState('idle')
    }
  }

  async function handleImport() {
    const selected = candidates.filter(c => c.selected)
    if (selected.length === 0) return

    setState('importing')
    setError(null)

    try {
      const res = await fetch('/api/gmaps/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          places: selected.map(c => c.place),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message ?? '장소를 저장하는 중 오류가 발생했습니다.')
        setState('review')
        return
      }

      setInsertedCount(data.inserted ?? selected.length)
      setInsertedIds(data.ids ?? [])
      setState('done')
    } catch {
      setError('네트워크 오류가 발생했습니다.')
      setState('review')
    }
  }

  function handleReset() {
    setState('idle')
    setCandidates([])
    setError(null)
    setInsertedCount(0)
    setInsertedIds([])
  }

  return (
    <div className="md:pl-44 min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-fg">구글맵 연동</h1>
          <p className="text-sm text-fg-muted mt-1">
            구글맵 공개 리스트에서 장소를 가져와 추가합니다.
          </p>
        </div>

        {/* idle / loading */}
        {(state === 'idle' || state === 'loading') && (
          <div className="bg-white rounded-xl border border-border p-6">
            <UrlInput
              onSubmit={handleUrlSubmit}
              loading={state === 'loading'}
              error={error}
            />
          </div>
        )}

        {/* review */}
        {state === 'review' && (
          <div className="bg-white rounded-xl border border-border p-6">
            <CandidateList
              candidates={candidates}
              onChange={setCandidates}
              onImport={handleImport}
              importing={false}
            />
            {error && (
              <p className="mt-3 text-sm text-critical-fg">{error}</p>
            )}
            <button
              onClick={handleReset}
              className="mt-4 text-sm text-fg-subtle hover:text-fg-muted transition-colors"
            >
              다른 URL 입력
            </button>
          </div>
        )}

        {/* importing */}
        {state === 'importing' && (
          <div className="bg-white rounded-xl border border-border p-6">
            <CandidateList
              candidates={candidates}
              onChange={setCandidates}
              onImport={handleImport}
              importing={true}
            />
          </div>
        )}

        {/* done: 이동 중 표시 */}
        {state === 'done' && (
          <div className="bg-white rounded-xl border border-border p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-base font-semibold text-fg mb-1">
              {insertedCount}개 장소가 추가되었습니다.
            </p>
            <p className="text-sm text-fg-muted">전체 탭으로 이동 중…</p>
          </div>
        )}
      </div>
      <Navigation />
    </div>
  )
}
