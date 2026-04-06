import type { Category, ReservationStatus, TripItem, TripPriority } from '@/types'

export const CATEGORY_OPTIONS: Category[] = [
  '교통',
  '숙박',
  '명소',
  '식당',
  '카페',
  '쇼핑',
  '문화시설',
  '공연·스포츠',
  '액티비티',
  '휴양',
  '기타',
]

export const TRIP_PRIORITY_OPTIONS: TripPriority[] = [
  '검토 필요',
  '시간 되면',
  '가고 싶음',
  '확정',
  '제외',
]

export const RESERVATION_STATUS_OPTIONS: ReservationStatus[] = [
  '확인 필요',
  '불필요',
  '필요(미예약)',
  '예약완료',
]

export const TRIP_DATE_MIN = '2026-07-01'
export const TRIP_DATE_MAX = '2026-07-31'

export const ITEM_FIELD_LABELS = {
  category: '카테고리',
  trip_priority: '이번 여행에서',
  reservation_status: '예약상태',
} as const

export const PLACEHOLDER_LABELS = {
  category: '카테고리 정보 없음',
  trip_priority: '미분류',
  reservation_status: '예약 정보 없음',
} as const

export const CHIP_BASE_TONE = 'bg-white border border-gray-200'
export const CHIP_TONE = `${CHIP_BASE_TONE} text-gray-700`
export const PLACEHOLDER_TONE = `${CHIP_BASE_TONE} text-gray-400`

export const CATEGORY_META: Record<Category, { dot: string }> = {
  교통: { dot: '#94A3B8' },
  숙박: { dot: '#7DD3FC' },
  명소: { dot: '#6EE7B7' },
  식당: { dot: '#FB923C' },
  카페: { dot: '#FDBA74' },
  쇼핑: { dot: '#C4B5FD' },
  문화시설: { dot: '#67E8F9' },
  '공연·스포츠': { dot: '#F9A8D4' },
  액티비티: { dot: '#86EFAC' },
  휴양: { dot: '#5EEAD4' },
  기타: { dot: '#FCD34D' },
}

export const TRIP_PRIORITY_META: Record<TripPriority, { description: string; order: number; chip: string }> = {
  '검토 필요': { description: '아직 결정하지 않은 후보', order: 0, chip: 'bg-gray-100 text-gray-500' },
  '시간 되면': { description: '여유가 있으면 가볼 곳', order: 1, chip: 'bg-blue-50 text-blue-500' },
  '가고 싶음': { description: '꼭 가고 싶은 곳', order: 2, chip: 'bg-amber-50 text-amber-600' },
  '확정': { description: '일정에 넣기로 결정', order: 3, chip: 'bg-emerald-100 text-emerald-700' },
  '제외': { description: '이번 여행에서 제외', order: 4, chip: 'bg-red-50 text-red-400' },
}

export const RESERVATION_STATUS_META: Record<ReservationStatus, { description: string }> = {
  '확인 필요': { description: '예약 필요 여부 미확정' },
  불필요: { description: '예약 없이 진행 가능' },
  '필요(미예약)': { description: '예약이 필요하지만 아직 안 함' },
  예약완료: { description: '예약 완료' },
}

const LEGACY_CATEGORY_MAP: Record<string, Category> = {
  교통: '교통',
  숙소: '숙박',
  숙박: '숙박',
  식당: '식당',
  카페: '카페',
  관광: '명소',
  명소: '명소',
  공연: '공연·스포츠',
  스포츠: '공연·스포츠',
  '공연·스포츠': '공연·스포츠',
  쇼핑: '쇼핑',
  문화시설: '문화시설',
  액티비티: '액티비티',
  휴양: '휴양',
  기타: '기타',
}

export function normalizeCategory(value: unknown): Category {
  return LEGACY_CATEGORY_MAP[String(value)] ?? '기타'
}

/**
 * DB의 status 컬럼 값과 priority 컬럼 값을 읽어 TripPriority로 변환한다.
 * 기존 데이터 마이그레이션 로직 포함.
 */
export function normalizeTripPriority(rawStatus: unknown, rawPriority: unknown): TripPriority {
  const s = String(rawStatus ?? '')
  const p = rawPriority != null ? String(rawPriority) : null

  // 이미 새 값이면 그대로
  if (TRIP_PRIORITY_OPTIONS.includes(s as TripPriority)) {
    return s as TripPriority
  }

  // 구 status 기반: 확정/제외 우선
  if (s === '확정') return '확정'
  if (s === '제외' || s === '탈락') return '제외'

  // 구 priority 기반
  if (p === '반드시' || p === '들를만해') return '가고 싶음'
  if (p === '시간 남으면') return '시간 되면'

  // 기본값
  return '검토 필요'
}

export function normalizeReservationStatus(value: unknown): ReservationStatus | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const normalized = String(value) as ReservationStatus
  if (RESERVATION_STATUS_OPTIONS.includes(normalized)) return normalized
  return null
}

export function normalizeTripItem(item: TripItem): { item: TripItem; changed: boolean } {
  const category = normalizeCategory(item.category)
  const reservation_status = normalizeReservationStatus(item.reservation_status)

  const changed =
    category !== item.category ||
    reservation_status !== (item.reservation_status ?? null)

  return {
    item: {
      ...item,
      category,
      reservation_status,
    },
    changed,
  }
}
