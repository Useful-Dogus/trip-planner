'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { useToast } from '@/components/UI/Toast'
import type { TripItem, Status } from '@/types'

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error('Failed to fetch')
    return r.json()
  })

export type SyncStatus = 'fresh' | 'stale' | 'offline' | 'error'

export function useItems() {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const { data, error, isLoading, isValidating, mutate } = useSWR<{ items: TripItem[] }>(
    hasMounted ? '/api/items' : null,
    fetcher
  )
  const { showToast } = useToast()

  const items = data?.items ?? []
  const ready = hasMounted
  const loading = !ready || isLoading

  const syncStatus: SyncStatus = (() => {
    if (!ready) return 'fresh'
    if (typeof navigator !== 'undefined' && !navigator.onLine) return 'offline'
    if (error) return 'error'
    if (isValidating && !loading) return 'stale'
    return 'fresh'
  })()

  async function updateItem(id: string, changes: Partial<TripItem>) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      showToast({ type: 'info', message: '오프라인 상태입니다. 인터넷 연결 후 다시 시도해주세요.' })
      return
    }
    const snapshot = data
    mutate(
      prev =>
        prev ? { items: prev.items.map(i => (i.id === id ? { ...i, ...changes } : i)) } : prev,
      { revalidate: false }
    )
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      })
      if (!res.ok) throw new Error('Save failed')
      mutate()
    } catch {
      mutate(snapshot, { revalidate: false })
      showToast({
        type: 'error',
        message: '저장에 실패했습니다.',
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
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' })
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

  async function createItem(item: Omit<TripItem, 'id' | 'created_at' | 'updated_at'>) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      showToast({ type: 'info', message: '오프라인 상태입니다. 인터넷 연결 후 다시 시도해주세요.' })
      return
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
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })
      if (!res.ok) throw new Error('Create failed')
      mutate()
    } catch {
      mutate(snapshot, { revalidate: false })
      showToast({
        type: 'error',
        message: '추가에 실패했습니다.',
        action: { label: '재시도', onClick: () => createItem(item) },
      })
    }
  }

  async function updateStatus(id: string, status: Status) {
    await updateItem(id, { status })
  }

  return {
    items,
    isLoading: loading,
    isValidating,
    syncStatus,
    error: error ?? null,
    updateItem,
    deleteItem,
    createItem,
    updateStatus,
  }
}
