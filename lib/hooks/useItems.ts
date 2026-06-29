'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { useToast } from '@/components/UI/Toast'
import type { TripItem } from '@/types'
import { normalizeTripItem } from '@/lib/itemOptions'
import { useOptionalTripId } from '@/lib/hooks/useTripContext'

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error('Failed to fetch')
    return r.json()
  })

export type SyncStatus = 'fresh' | 'stale' | 'offline' | 'error'

function applyItemChanges(item: TripItem, changes: Record<string, unknown>): TripItem {
  return normalizeTripItem({ ...item, ...changes } as TripItem).item
}

function withTripId(url: string, tripId: string | null): string {
  if (!tripId) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}tripId=${encodeURIComponent(tripId)}`
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const payload = (await res.json()) as { error?: unknown }
    return typeof payload.error === 'string' && payload.error.trim() ? payload.error : fallback
  } catch {
    return fallback
  }
}

export function useItems() {
  const [hasMounted, setHasMounted] = useState(false)
  const tripId = useOptionalTripId()

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const swrKey = hasMounted ? withTripId('/api/items', tripId) : null

  const { data, error, isLoading, isValidating, mutate } = useSWR<{ items: TripItem[] }>(
    swrKey,
    fetcher
  )
  const { showToast } = useToast()

  const items = (data?.items ?? []).map(item => normalizeTripItem(item).item)
  const ready = hasMounted
  const loading = !ready || isLoading

  const syncStatus: SyncStatus = (() => {
    if (!ready) return 'fresh'
    if (typeof navigator !== 'undefined' && !navigator.onLine) return 'offline'
    if (error) return 'error'
    if (isValidating && !loading) return 'stale'
    return 'fresh'
  })()

  async function updateItem(id: string, changes: Record<string, unknown>) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      showToast({ type: 'info', message: '오프라인 상태입니다. 인터넷 연결 후 다시 시도해주세요.' })
      return
    }
    const snapshot = data
    mutate(
      prev =>
        prev ? { items: prev.items.map(i => (i.id === id ? applyItemChanges(i, changes) : i)) } : prev,
      { revalidate: false }
    )
    try {
      const res = await fetch(withTripId(`/api/items/${id}`, tripId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      })
      if (!res.ok) throw new Error(await readErrorMessage(res, '저장에 실패했습니다.'))
      mutate()
    } catch (e) {
      mutate(snapshot, { revalidate: false })
      const message = e instanceof Error ? e.message : '저장에 실패했습니다.'
      showToast({
        type: 'error',
        message,
        action: { label: '재시도', onClick: () => updateItem(id, changes) },
      })
    }
  }

  async function deleteItem(id: string) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      showToast({ type: 'info', message: '오프라인 상태입니다. 인터넷 연결 후 다시 시도해주세요.' })
      return
    }
    const snapshot = data
    mutate(
      prev => (prev ? { items: prev.items.filter(i => i.id !== id) } : prev),
      { revalidate: false }
    )
    try {
      const res = await fetch(withTripId(`/api/items/${id}`, tripId), { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      mutate()
    } catch {
      mutate(snapshot, { revalidate: false })
      showToast({
        type: 'error',
        message: '삭제에 실패했습니다.',
        action: { label: '재시도', onClick: () => deleteItem(id) },
      })
    }
  }

  async function createItem(
    item: Omit<TripItem, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<TripItem | null> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      showToast({ type: 'info', message: '오프라인 상태입니다. 인터넷 연결 후 다시 시도해주세요.' })
      return null
    }
    const tmpId = `tmp_${Date.now()}`
    const now = new Date().toISOString()
    const tmpItem: TripItem = { ...item, id: tmpId, created_at: now, updated_at: now }
    const snapshot = data
    mutate(
      prev => (prev ? { items: [tmpItem, ...prev.items] } : { items: [tmpItem] }),
      { revalidate: false }
    )
    try {
      const res = await fetch(withTripId('/api/items', tripId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })
      if (!res.ok) throw new Error('Create failed')
      const payload = (await res.json()) as { item?: TripItem }
      mutate()
      return payload?.item ?? null
    } catch {
      mutate(snapshot, { revalidate: false })
      showToast({
        type: 'error',
        message: '추가에 실패했습니다.',
        action: { label: '재시도', onClick: () => createItem(item) },
      })
      return null
    }
  }

  return {
    items,
    isLoading: loading,
    isValidating,
    syncStatus,
    error: error ?? null,
    updateItem,
    updateItemsBulk,
    deleteItem,
    createItem,
  }

  /**
   * 여러 항목을 한 번에 수정한다(일괄 명명 등).
   * 개별 updateItem 을 N번 부르면 매 건마다 전체 revalidate 가 일어나 항목이
   * "하나씩" 갱신/사라지는 stagger 가 생긴다(#298). 대신:
   *  1) 옵티미스틱 업데이트 1회로 전체 변경을 한 번에 반영
   *  2) PATCH 를 병렬 실행
   *  3) 끝나고 revalidate 1회로 수렴(실패분은 서버 진실로 자동 복원)
   */
  async function updateItemsBulk(
    updates: { id: string; changes: Record<string, unknown> }[],
  ): Promise<{ okIds: string[]; failedIds: string[] }> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      showToast({ type: 'info', message: '오프라인 상태입니다. 인터넷 연결 후 다시 시도해주세요.' })
      return { okIds: [], failedIds: updates.map(u => u.id) }
    }
    if (updates.length === 0) return { okIds: [], failedIds: [] }

    const changeMap = new Map(updates.map(u => [u.id, u.changes]))
    mutate(
      prev =>
        prev
          ? {
              items: prev.items.map(i =>
                changeMap.has(i.id) ? applyItemChanges(i, changeMap.get(i.id)!) : i,
              ),
            }
          : prev,
      { revalidate: false },
    )

    const results = await Promise.all(
      updates.map(async u => {
        try {
          const res = await fetch(withTripId(`/api/items/${u.id}`, tripId), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(u.changes),
          })
          return { id: u.id, ok: res.ok }
        } catch {
          return { id: u.id, ok: false }
        }
      }),
    )

    // revalidate 1회로 수렴 — 성공분은 서버 새 값, 실패분은 옛 값으로 자동 복원.
    mutate()

    return {
      okIds: results.filter(r => r.ok).map(r => r.id),
      failedIds: results.filter(r => !r.ok).map(r => r.id),
    }
  }
}
