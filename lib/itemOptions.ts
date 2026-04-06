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

export const CATEGORY_META: Record<Category, { tone: string; dot: string }> = {
  교통: { tone: 'bg-slate-100 text-slate-700', dot: '#94A3B8' },
  숙박: { tone: 'bg-sky-100 text-sky-700', dot: '#7DD3FC' },
  명소: { tone: 'bg-emerald-100 text-emerald-700', dot: '#6EE7B7' },
  식당: { tone: 'bg-orange-100 text-orange-700', dot: '#FB923C' },
  카페: { tone: 'bg-amber-100 text-amber-700', dot: '#FDBA74' },
  쇼핑: { tone: 'bg-violet-100 text-violet-700', dot: '#C4B5FD' },
  문화시설: { tone: 'bg-cyan-100 text-cyan-700', dot: '#67E8F9' },
  '공연·스포츠': { tone: 'bg-pink-100 text-pink-700', dot: '#F9A8D4' },
  액티비티: { tone: 'bg-lime-100 text-lime-700', dot: '#86EFAC' },
  휴양: { tone: 'bg-teal-100 text-teal-700', dot: '#5EEAD4' },
  기타: { tone: 'bg-yellow-100 text-yellow-700', dot: '#FCD34D' },
}

export const STATUS_META: Record<Status, { tone: string; description: string }> = {
  아이디어: { tone: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200', description: '후보로 보관 중' },
  검토: { tone: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200', description: '살펴보는 중' },
  확정: { tone: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', description: '일정에 넣기' },
  제외: { tone: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200', description: '이번엔 제외' },
}

export const RESERVATION_STATUS_META: Record<ReservationStatus, { tone: string; description: string }> = {
  '확인 필요': { tone: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', description: '예약 필요 여부 미확정' },
  불필요: { tone: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200', description: '예약 없이 진행 가능' },
  '필요(미예약)': { tone: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200', description: '예약이 필요하지만 아직 안 함' },
  예약완료: { tone: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200', description: '예약 완료' },
}

export const PRIORITY_META: Record<Priority, { tone: string; dot: string; description: string; order: number }> = {
  반드시: { tone: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200', dot: 'bg-rose-500', description: '꼭 포함', order: 0 },
  들를만해: { tone: 'bg-orange-50 text-orange-600 ring-1 ring-orange-200', dot: 'bg-orange-400', description: '일정 맞으면 포함', order: 1 },
  '시간 남으면': { tone: 'bg-gray-50 text-gray-500 ring-1 ring-gray-200', dot: 'bg-gray-300', description: '여유 있으면 포함', order: 2 },
}

export const PLACEHOLDER_TONE =
  'border border-dashed border-gray-200 bg-white text-gray-400'

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
