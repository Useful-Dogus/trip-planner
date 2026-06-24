'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Layout/Navigation'
import UrlInput from '@/components/GmapsImport/UrlInput'
import CandidateList from '@/components/GmapsImport/CandidateList'
import StickyActionBar from '@/components/UI/StickyActionBar'
import { useTripId, useTripPath } from '@/lib/hooks/useTripContext'
import { useBeforeUnload } from '@/lib/hooks/useBeforeUnload'
import TripPageHeader from '@/components/Layout/TripPageHeader'
import type { ImportCandidate } from '@/types'

type PageState = 'idle' | 'loading' | 'review' | 'importing' | 'done'

export default function GmapsImportPage() {
  const router = useRouter()
  const tripId = useTripId()
  const tripPath = useTripPath()
  const [state, setState] = useState<PageState>('idle')
  const [candidates, setCandidates] = useState<ImportCandidate[]>([])
  const [error, setError] = useState<string | null>(null)
  const [insertedCount, setInsertedCount] = useState(0)
  const [insertedIds, setInsertedIds] = useState<string[]>([])

  // 일괄 추가 진행 중 탭 닫기·새로고침·외부 이동을 막아 끊김을 방지(#324).
  useBeforeUnload(state === 'importing')

  useEffect(() => {
    if (state !== 'done') return
    const target =
      insertedIds.length > 0
        ? `${tripPath('list')}?imported=${insertedIds.join(',')}`
        : tripPath('list')
    router.push(target)
  }, [state, insertedIds, router, tripPath])

  async function handleUrlSubmit(url: string) {
    setState('loading')
    setError(null)

    try {
      const res = await fetch('/api/gmaps/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, tripId }),
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
      const res = await fetch(`/api/gmaps/import?tripId=${encodeURIComponent(tripId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
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
    <div className="md:pl-44 min-h-screen bg-bg-elevated">
      <div className="max-w-2xl mx-auto pb-24 md:pb-8">
        <TripPageHeader
          section="구글맵 연동"
          body={<p className="text-sm text-fg-muted mt-1">구글맵 공개 리스트에서 장소를 가져와 추가합니다.</p>}
          className="mb-6"
        />
        <div className="px-4">

        {(state === 'idle' || state === 'loading') && (
          <div className="bg-bg-elevated rounded-xl border border-border p-6">
            <UrlInput
              onSubmit={handleUrlSubmit}
              loading={state === 'loading'}
              error={error}
            />
          </div>
        )}

        {state === 'review' && (
          <div className="bg-bg-elevated rounded-xl border border-border p-6">
            <CandidateList
              candidates={candidates}
              onChange={setCandidates}
              onImport={handleImport}
              importing={false}
            />
            {error && (
              <p className="mt-3 text-sm text-critical-fg">{error}</p>
            )}
            <StickyActionBar className="justify-start">
              <button
                onClick={handleReset}
                className="text-sm text-fg-subtle hover:text-fg-muted transition-colors"
              >
                다른 URL 입력
              </button>
            </StickyActionBar>
          </div>
        )}

        {state === 'importing' && (
          <div className="bg-bg-elevated rounded-xl border border-border p-6">
            <p
              role="status"
              className="mb-4 rounded-lg bg-info-bg border border-info-border px-3 py-2 text-sm text-info-fg"
            >
              장소를 추가하는 중입니다. 완료될 때까지 이 페이지를 닫거나 새로고침하지 마세요.
            </p>
            <CandidateList
              candidates={candidates}
              onChange={setCandidates}
              onImport={handleImport}
              importing={true}
            />
          </div>
        )}

        {state === 'done' && (
          <div className="bg-bg-elevated rounded-xl border border-border p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-success-fg"
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
      </div>
      <Navigation />
    </div>
  )
}
