import Fuse from 'fuse.js'
import type { GooglePlace, ImportCandidate, TripItem } from '@/types'
import { mapGoogleCategory } from './categoryMap'

/**
 * Fuse.js 설정 (한국어 포함 모든 텍스트에서 동작)
 * threshold 0.35: 낮을수록 더 정확한 일치만 허용
 */
const FUSE_THRESHOLD = 0.35

/**
 * 유사도 점수 기준 (score가 threshold 이하이면 유사로 판단)
 * fuse.js score: 0 = 완전 일치, 1 = 완전 불일치
 */
const SIMILARITY_SCORE_THRESHOLD = 0.35

/**
 * GooglePlace[] + 기존 TripItem[] → ImportCandidate[] 생성
 *
 * 중복 감지:
 *   1차: google_place_id 완전 일치 → 'duplicate' (선택 불가)
 *   2차: 이름 fuzzy match (fuse.js) → 'similar' (기본 선택 해제 + 경고)
 *   그 외: 'new' (기본 선택)
 */
export function matchCandidates(
  places: GooglePlace[],
  existingItems: TripItem[]
): ImportCandidate[] {
  // 기존 items에서 google_place_id 인덱스 생성
  const placeIdIndex = new Map<string, TripItem>()
  for (const item of existingItems) {
    if (item.google_place_id) {
      placeIdIndex.set(item.google_place_id, item)
    }
  }

  // Fuse 인스턴스 생성 (이름 유사도 검색)
  const fuse = new Fuse(existingItems, {
    keys: ['name'],
    threshold: FUSE_THRESHOLD,
    distance: 100,
    includeScore: true,
  })

  return places.map(place => {
    // 1차: google_place_id 완전 일치
    if (place.googlePlaceId && placeIdIndex.has(place.googlePlaceId)) {
      return {
        place,
        status: 'duplicate' as const,
        selected: false,
        mappedCategory: mapGoogleCategory(place.googleCategory),
      }
    }

    // 2차: 이름 유사도 매칭
    const results = fuse.search(place.name)
    const bestMatch = results[0]

    if (
      bestMatch &&
      bestMatch.score !== undefined &&
      bestMatch.score <= SIMILARITY_SCORE_THRESHOLD
    ) {
      return {
        place,
        status: 'similar' as const,
        similarItem: {
          id: bestMatch.item.id,
          name: bestMatch.item.name,
        },
        selected: false,
        mappedCategory: mapGoogleCategory(place.googleCategory),
      }
    }

    // 신규
    return {
      place,
      status: 'new' as const,
      selected: true,
      mappedCategory: mapGoogleCategory(place.googleCategory),
    }
  })
}
