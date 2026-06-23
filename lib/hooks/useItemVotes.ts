'use client'

import useSWR from 'swr'
import type { VoteTally } from '@/app/api/item-votes/route'

type Tallies = Record<string, VoteTally>

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('투표 조회 실패')
    return r.json() as Promise<{ tallies: Tallies }>
  })

/**
 * 항목별 그룹 투표 집계(#265). 멤버별 1항목 1투표, 낙관적 토글.
 * tripId 가 없으면 비활성.
 */
export function useItemVotes(tripId: string | null) {
  const key = tripId ? `/api/item-votes?tripId=${tripId}` : null
  const { data, mutate } = useSWR(key, fetcher, { revalidateOnFocus: false })
  const tallies = data?.tallies ?? {}

  async function toggle(itemId: string) {
    if (!tripId) return
    const current = tallies[itemId] ?? { count: 0, mine: false }
    const optimistic: Tallies = {
      ...tallies,
      [itemId]: {
        count: current.mine ? current.count - 1 : current.count + 1,
        mine: !current.mine,
      },
    }
    try {
      await mutate(
        async () => {
          const res = await fetch('/api/item-votes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId, tripId }),
          })
          if (!res.ok) throw new Error('투표 실패')
          return { tallies: optimistic }
        },
        { optimisticData: { tallies: optimistic }, rollbackOnError: true, revalidate: true },
      )
    } catch {
      // 롤백은 SWR 이 처리. 권한 없음(viewer) 등은 원래 값으로 복원된다.
    }
  }

  return { tallies, toggle }
}
