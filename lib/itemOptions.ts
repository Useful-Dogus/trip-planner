import type { Category, ReservationStatus, TripItem, TripPriority } from '@/types'
import {
  Bus,
  Hotel,
  Landmark,
  UtensilsCrossed,
  Coffee,
  ShoppingBag,
  Palette,
  Drama,
  Target,
  Palmtree,
  Bookmark,
  type LucideIcon,
} from 'lucide-react'

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

// 카테고리 식별은 아이콘 + 라벨 텍스트로만 한다 (#240). 색상은 정보 전달이 안 되고
// 시각 잡음만 더해 제거했다. 분포 비교가 목적인 CategoryStackBar 만 예외로
// 아래 CATEGORY_STACK_COLORS 를 쓴다.
export const CATEGORY_META: Record<Category, { Icon: LucideIcon }> = {
  교통: { Icon: Bus },
  숙박: { Icon: Hotel },
  명소: { Icon: Landmark },
  식당: { Icon: UtensilsCrossed },
  카페: { Icon: Coffee },
  쇼핑: { Icon: ShoppingBag },
  문화시설: { Icon: Palette },
  '공연·스포츠': { Icon: Drama },
  액티비티: { Icon: Target },
  휴양: { Icon: Palmtree },
  기타: { Icon: Bookmark },
}

// CategoryStackBar 전용 팔레트. 스택 바는 카테고리 분포 비교가 목적이라
// 색상이 정보 그 자체이므로 여기서만 카테고리별 색을 유지한다 (#240 결정).
// 다른 곳에서는 절대 import 하지 않는다.
export const CATEGORY_STACK_COLORS: Record<Category, string> = {
  교통: '#94a3b8',       // slate-400
  숙박: '#38bdf8',       // sky-400
  명소: '#fb923c',       // orange-400
  식당: '#f87171',       // red-400
  카페: '#b45309',       // amber-700
  쇼핑: '#f472b6',       // pink-400
  문화시설: '#a78bfa',   // violet-400
  '공연·스포츠': '#34d399', // emerald-400
  액티비티: '#fbbf24',   // amber-400
  휴양: '#4ade80',       // green-400
  기타: '#cbd5e1',       // slate-300
}

interface PriorityMeta {
  description: string
  order: number
  emoji: string
  /** Tailwind className 기반 톤 — 라이트/다크 자동 적용 */
  className: string
}

export const TRIP_PRIORITY_META: Record<TripPriority, PriorityMeta> = {
  확정: {
    description: '일정에 넣기로 결정',
    order: 0,
    emoji: '✅',
    className: 'bg-success-bg text-success-fg border-success-border font-semibold',
  },
  '가고 싶음': {
    description: '꼭 가고 싶은 곳',
    order: 1,
    emoji: '⭐',
    className: 'bg-accent-subtle text-accent border-accent/30',
  },
  '시간 되면': {
    description: '여유가 있으면 가볼 곳',
    order: 2,
    emoji: '⏳',
    className: 'bg-info-bg text-info-fg border-info-border',
  },
  '검토 필요': {
    description: '아직 결정하지 않은 후보',
    order: 3,
    emoji: '🤔',
    className: 'bg-bg-subtle text-fg-subtle border-border',
  },
  제외: {
    description: '이번 여행에서 제외',
    order: 4,
    emoji: '❌',
    className: 'bg-bg-subtle text-fg-subtle border-border line-through',
  },
}

interface ReservationMeta {
  description: string
  order: number
  emoji: string
  className: string
}

export const RESERVATION_STATUS_META: Record<ReservationStatus, ReservationMeta> = {
  예약완료: {
    description: '예약 완료',
    order: 0,
    emoji: '✅',
    className: 'bg-success-bg text-success-fg border-success-border',
  },
  '필요(미예약)': {
    description: '예약이 필요하지만 아직 안 함',
    order: 1,
    emoji: '🔔',
    className: 'bg-warning-bg text-warning-fg border-warning-border font-semibold',
  },
  '확인 필요': {
    description: '예약 필요 여부 미확정',
    order: 2,
    emoji: '🔍',
    className: 'bg-warning-bg text-warning-fg border-warning-border',
  },
  불필요: {
    description: '예약 없이 진행 가능',
    order: 3,
    emoji: '🆓',
    className: 'bg-bg-subtle text-fg-subtle border-border',
  },
}

/**
 * trip_priority 비교 함수. null/undefined 는 dir 과 무관하게 항상 마지막.
 * 동순위 tie-break 는 호출자 책임.
 */
export function compareTripPriority(
  a: TripPriority | null | undefined,
  b: TripPriority | null | undefined,
  dir: 'asc' | 'desc',
): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  const cmp = TRIP_PRIORITY_META[a].order - TRIP_PRIORITY_META[b].order
  return dir === 'asc' ? cmp : -cmp
}

/**
 * reservation_status 비교 함수. null/undefined 는 dir 과 무관하게 항상 마지막.
 * 동순위 tie-break 는 호출자 책임.
 */
export function compareReservationStatus(
  a: ReservationStatus | null | undefined,
  b: ReservationStatus | null | undefined,
  dir: 'asc' | 'desc',
): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  const cmp = RESERVATION_STATUS_META[a].order - RESERVATION_STATUS_META[b].order
  return dir === 'asc' ? cmp : -cmp
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
