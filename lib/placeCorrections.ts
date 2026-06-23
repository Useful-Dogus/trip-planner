import type { SupabaseClient } from '@supabase/supabase-js'
import type { OpeningHours } from '@/types'

export interface PlaceCorrection {
  googlePlaceId: string
  openingHours: OpeningHours | null
  closedDays: number[] | null
  /** 이 장소의 누적 보정 수(신뢰도 신호). */
  count: number
  /** 최신 보정 시각(ISO). */
  updatedAt: string
}

export interface CorrectionInput {
  googlePlaceId: string
  openingHours: OpeningHours | null
  closedDays: number[] | null
}

type Client = SupabaseClient

/**
 * 여러 place 의 "현재값"(=최신 보정) + 누적 수를 한 번에 읽는다.
 * created_at desc 정렬이라 place 별 첫 행이 최신값, 같은 place 의 후속 행은 count 만 올린다.
 */
export async function readLatestCorrections(
  client: Client,
  placeIds: string[],
): Promise<Map<string, PlaceCorrection>> {
  const ids = Array.from(new Set(placeIds.filter(Boolean)))
  if (ids.length === 0) return new Map()

  const { data, error } = await client
    .from('place_hours_corrections')
    .select('google_place_id, opening_hours, closed_days, created_at')
    .in('google_place_id', ids)
    .order('created_at', { ascending: false })
  if (error) throw error

  const map = new Map<string, PlaceCorrection>()
  for (const row of (data ?? []) as Array<{
    google_place_id: string
    opening_hours: OpeningHours | null
    closed_days: number[] | null
    created_at: string
  }>) {
    const existing = map.get(row.google_place_id)
    if (!existing) {
      map.set(row.google_place_id, {
        googlePlaceId: row.google_place_id,
        openingHours: row.opening_hours ?? null,
        closedDays: row.closed_days ?? null,
        count: 1,
        updatedAt: row.created_at,
      })
    } else {
      existing.count += 1
    }
  }
  return map
}

export async function insertCorrection(
  client: Client,
  authorUserId: string,
  input: CorrectionInput,
): Promise<void> {
  const { error } = await client.from('place_hours_corrections').insert({
    google_place_id: input.googlePlaceId,
    opening_hours: input.openingHours ?? null,
    closed_days: input.closedDays ?? null,
    author_user_id: authorUserId,
  })
  if (error) throw error
}
