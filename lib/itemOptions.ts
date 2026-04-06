import type { Category, Priority, ReservationStatus, Status, TripItem } from '@/types'

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

export const STATUS_OPTIONS: Status[] = ['아이디어', '검토', '확정', '제외']
export const RESERVATION_STATUS_OPTIONS: ReservationStatus[] = [
  '확인 필요',
  '불필요',
  '필요(미예약)',
  '예약완료',
]
export const PRIORITY_OPTIONS: Priority[] = ['반드시', '들를만해', '시간 남으면']

export const ITEM_FIELD_LABELS = {
  category: '카테고리',
  status: '상태',
  reservation_status: '예약상태',
  priority: '우선순위',
} as const

export const PLACEHOLDER_LABELS = {
  category: '카테고리 정보 없음',
  status: '상태 정보 없음',
  reservation_status: '예약 정보 없음',
  priority: '우선순위 정보 없음',
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

export const STATUS_META: Record<Status, { description: string }> = {
  아이디어: { description: '후보로 보관 중' },
  검토: { description: '살펴보는 중' },
  확정: { description: '일정에 넣기' },
  제외: { description: '이번엔 제외' },
}

export const RESERVATION_STATUS_META: Record<ReservationStatus, { description: string }> = {
  '확인 필요': { description: '예약 필요 여부 미확정' },
  불필요: { description: '예약 없이 진행 가능' },
  '필요(미예약)': { description: '예약이 필요하지만 아직 안 함' },
  예약완료: { description: '예약 완료' },
}

export const PRIORITY_META: Record<Priority, { description: string; order: number }> = {
  반드시: { description: '꼭 포함', order: 0 },
  들를만해: { description: '일정 맞으면 포함', order: 1 },
  '시간 남으면': { description: '여유 있으면 포함', order: 2 },
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

const LEGACY_STATUS_MAP: Record<string, Status> = {
  검토중: '검토',
  보류: '아이디어',
  대기중: '검토',
  확정: '확정',
  탈락: '제외',
  아이디어: '아이디어',
  검토: '검토',
  제외: '제외',
}

const LEGACY_PRIORITY_MAP: Record<string, Priority> = {
  반드시: '반드시',
  들를만해: '들를만해',
  '시간 남으면': '시간 남으면',
}

export function normalizeCategory(value: unknown): Category {
  return LEGACY_CATEGORY_MAP[String(value)] ?? '기타'
}

export function normalizeStatus(value: unknown): Status {
  return LEGACY_STATUS_MAP[String(value)] ?? '아이디어'
}

export function normalizePriority(value: unknown): Priority | undefined {
  if (value == null) return undefined
  return LEGACY_PRIORITY_MAP[String(value)]
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
  const status = normalizeStatus(item.status)
  const priority = normalizePriority(item.priority)
  const reservation_status = normalizeReservationStatus(item.reservation_status)

  const changed =
    category !== item.category ||
    status !== item.status ||
    priority !== item.priority ||
    reservation_status !== (item.reservation_status ?? null)

  return {
    item: {
      ...item,
      category,
      status,
      priority,
      reservation_status,
    },
    changed,
  }
}
