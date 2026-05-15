import type { GooglePlace } from '@/types'
import { mapGoogleCategory } from './categoryMap'

export class GmapsParserError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GmapsParserError'
  }
}

/**
 * `)]}'\n` 접두사를 제거하고 JSON.parse를 시도한다.
 */
function stripXssiPrefix(text: string): unknown {
  const stripped = text.replace(/^\s*\)\]\}'\s*\n?/, '')
  return JSON.parse(stripped)
}

/**
 * 중첩된 배열에서 특정 타입의 값을 재귀적으로 탐색한다.
 */
function findValues(obj: unknown, predicate: (v: unknown) => boolean): unknown[] {
  const results: unknown[] = []

  function traverse(node: unknown) {
    if (predicate(node)) results.push(node)
    if (Array.isArray(node)) node.forEach(traverse)
    else if (node && typeof node === 'object') {
      Object.values(node as Record<string, unknown>).forEach(traverse)
    }
  }

  traverse(obj)
  return results
}

/**
 * 위경도 쌍 [lat, lng]를 재귀적으로 탐색한다.
 * 구글맵 응답의 [null, null, lat, lng] 패턴을 찾는다.
 */
function extractCoordinateArray(arr: unknown[]): { lat: number; lng: number } | null {
  // 패턴: [null, null, number, number] or [number, number]
  if (
    arr.length >= 4 &&
    arr[0] === null &&
    arr[1] === null &&
    typeof arr[2] === 'number' &&
    typeof arr[3] === 'number'
  ) {
    const lat = arr[2] as number
    const lng = arr[3] as number
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng }
    }
  }
  if (
    arr.length === 2 &&
    typeof arr[0] === 'number' &&
    typeof arr[1] === 'number'
  ) {
    const lat = arr[0] as number
    const lng = arr[1] as number
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && (lat !== 0 || lng !== 0)) {
      return { lat, lng }
    }
  }
  return null
}

/**
 * HTML에서 구글맵 내장 JSON 데이터 블록을 추출한다.
 * 구글맵 페이지는 window.APP_INITIALIZATION_STATE 또는 유사한 전역 변수에
 * 장소 데이터를 포함하는 JSON을 스크립트 태그에 내장한다.
 */
function extractJsonFromHtml(html: string): string[] {
  const candidates: string[] = []

  // 패턴 1: )]}' 로 시작하는 script 데이터 블록
  const xssiPattern = /\)\]\}'\s*\n([\s\S]+?)(?=<\/script>|$)/g
  let m
  while ((m = xssiPattern.exec(html)) !== null) {
    candidates.push(m[1].trim())
  }

  // 패턴 2: window.APP_INITIALIZATION_STATE = [...]
  const appInitPattern = /APP_INITIALIZATION_STATE\s*=\s*(\[[\s\S]+?\]);?\s*(?:window|var|let|const|<\/script>)/
  const appInitMatch = html.match(appInitPattern)
  if (appInitMatch) candidates.push(appInitMatch[1])

  // 패턴 3: AF_initDataCallback(...) 스크립트 블록
  const afPattern = /AF_initDataCallback\(\{[^}]*data:([\s\S]+?)\}\s*\)/g
  while ((m = afPattern.exec(html)) !== null) {
    candidates.push(m[1].trim())
  }

  // 패턴 4: 대형 JSON 배열 추출 (최소 1000자)
  const largeJsonPattern = /(\[{1}[\s\S]{1000,}?\]{1})/g
  while ((m = largeJsonPattern.exec(html)) !== null) {
    if (m[1].includes('null') && m[1].includes('"')) {
      candidates.push(m[1])
    }
  }

  return candidates
}

interface RawPlace {
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  placeId: string | null
  types: string[]
}

function parseEntityListPayload(payload: unknown): RawPlace[] {
  if (!Array.isArray(payload) || payload.length === 0) return []

  const root = payload.find(node => Array.isArray(node) && node.length >= 9) as unknown[] | undefined
  if (!root) return []

  const entries = root[8]
  if (!Array.isArray(entries)) return []

  const places: RawPlace[] = []

  for (const entry of entries) {
    if (!Array.isArray(entry)) continue

    const details = entry[1]
    const name = entry[2]

    if (!Array.isArray(details) || typeof name !== 'string' || !name.trim()) {
      continue
    }

    const address =
      typeof details[4] === 'string'
        ? details[4]
        : typeof details[2] === 'string'
          ? details[2]
          : null

    const coords = Array.isArray(details[5]) ? extractCoordinateArray(details[5]) : null

    const idArray = Array.isArray(details[6])
      ? details[6].filter((value): value is string => typeof value === 'string')
      : []
    const pathId = typeof details[7] === 'string' ? details[7] : null

    places.push({
      name: name.trim(),
      address,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      placeId: pathId ?? (idArray.length > 0 ? idArray.join(':') : null),
      types: [],
    })
  }

  return places.filter(place => place.lat !== null && place.lng !== null)
}

/**
 * 파싱된 JSON 데이터에서 장소 목록을 추출한다.
 */
function extractPlacesFromData(data: unknown): RawPlace[] {
  const places: RawPlace[] = []

  // 문자열 배열 수집 (이름, 주소 후보)
  const strings = findValues(
    data,
    v => typeof v === 'string' && v.length > 2 && v.length < 200
  ) as string[]

  // ChIJ로 시작하는 place ID 패턴 찾기
  const placeIds = strings.filter(s => /^ChIJ[A-Za-z0-9_-]{20,}$/.test(s))

  // 좌표 배열 찾기
  const coordArrays = findValues(data, v => Array.isArray(v) && v.length >= 2) as unknown[][]
  const coordPairs = coordArrays
    .map(arr => extractCoordinateArray(arr))
    .filter(Boolean) as { lat: number; lng: number }[]

  // 장소 데이터 구조 탐색: [name, address, ...] 패턴
  function traverseForPlaces(node: unknown, depth = 0) {
    if (depth > 20) return
    if (!Array.isArray(node)) return

    // 이름처럼 보이는 문자열이 첫 번째 원소인 배열
    if (
      node.length >= 2 &&
      typeof node[0] === 'string' &&
      node[0].length > 1 &&
      node[0].length < 100 &&
      !/^https?:\/\//.test(node[0]) &&
      !/^ChIJ/.test(node[0])
    ) {
      const coordIdx = node.findIndex(
        (el, i) =>
          i > 0 &&
          Array.isArray(el) &&
          extractCoordinateArray(el as unknown[]) !== null
      )

      if (coordIdx !== -1) {
        const coords = extractCoordinateArray(node[coordIdx] as unknown[])
        if (coords) {
          const name = node[0] as string
          const address =
            typeof node[1] === 'string' && node[1] !== name ? node[1] : null
          const placeId =
            (node.find(
              (el, i) => i > 0 && typeof el === 'string' && /^ChIJ/.test(el)
            ) as string) ?? null

          places.push({
            name,
            address,
            lat: coords.lat,
            lng: coords.lng,
            placeId,
            types: [],
          })
          return
        }
      }
    }

    node.forEach(child => traverseForPlaces(child, depth + 1))
  }

  traverseForPlaces(data)

  // place ID가 있는 경우 매칭
  if (places.length === 0 && placeIds.length > 0 && coordPairs.length > 0) {
    // fallback: placeId와 좌표를 순서대로 매칭
    for (let i = 0; i < Math.min(placeIds.length, coordPairs.length); i++) {
      places.push({
        name: `장소 ${i + 1}`,
        address: null,
        lat: coordPairs[i].lat,
        lng: coordPairs[i].lng,
        placeId: placeIds[i],
        types: [],
      })
    }
  }

  // 중복 제거 (같은 name+lat+lng)
  const seen = new Set<string>()
  return places.filter(p => {
    const key = `${p.name}|${p.lat}|${p.lng}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * HTML에서 Google Maps 리스트의 장소 목록을 파싱한다.
 * @throws GmapsParserError
 */
export function parseListPage(html: string): GooglePlace[] {
  if (html.trim().startsWith(")]}'")) {
    try {
      const entityListPlaces = parseEntityListPayload(stripXssiPrefix(html))
      if (entityListPlaces.length > 0) {
        return entityListPlaces.map(p => ({
          name: p.name,
          address: p.address,
          lat: p.lat,
          lng: p.lng,
          googlePlaceId: p.placeId,
          googleCategory: p.types[0] ?? null,
        }))
      }
    } catch {
      // Fall through to legacy HTML parser when the payload format does not match.
    }
  }

  const jsonCandidates = extractJsonFromHtml(html)

  if (jsonCandidates.length === 0) {
    throw new GmapsParserError(
      '장소 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
    )
  }

  let bestPlaces: RawPlace[] = []

  for (const candidate of jsonCandidates) {
    try {
      let parsed: unknown
      try {
        parsed = JSON.parse(candidate)
      } catch {
        parsed = stripXssiPrefix(candidate)
      }

      const places = extractPlacesFromData(parsed)
      if (places.length > bestPlaces.length) {
        bestPlaces = places
      }
    } catch {
      // 이 후보는 파싱 불가 — 계속 시도
    }
  }

  if (bestPlaces.length === 0) {
    // 비공개 리스트 감지 재확인
    if (html.includes('accounts.google.com') || html.includes('ServiceLogin')) {
      throw new GmapsParserError(
        '비공개 리스트는 지원하지 않습니다. 리스트를 공개로 설정한 후 다시 시도해주세요.'
      )
    }
    // 빈 리스트도 정상 처리
    return []
  }

  return bestPlaces.map(p => ({
    name: p.name,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
    googlePlaceId: p.placeId,
    googleCategory: p.types[0] ?? null,
  }))
}

/**
 * GooglePlace 배열에 카테고리 매핑을 적용한다.
 */
export function enrichWithCategory(
  places: GooglePlace[]
): (GooglePlace & { mappedCategory: ReturnType<typeof mapGoogleCategory> })[] {
  return places.map(p => ({
    ...p,
    mappedCategory: mapGoogleCategory(p.googleCategory),
  }))
}
