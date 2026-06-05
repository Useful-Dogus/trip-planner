import type { TripItem } from '@/types'
import { formatBudget, normalizeCurrency } from '@/lib/currency'

interface BuildOpts {
  tripTitle?: string
  startDate?: string | null
  endDate?: string | null
  currency?: string
}

function dateKey(it: TripItem): string {
  return it.date ?? ''
}

function formatTime(t?: string): string {
  if (!t) return ''
  return t.length >= 5 ? t.slice(0, 5) : t
}

function dayHeader(dateISO: string): string {
  const d = new Date(dateISO + 'T00:00:00')
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
  return `## ${dateISO} (${weekday})`
}

/**
 * 확정(`trip_priority === '확정'`) + 날짜 있는 항목만 텍스트로 직렬화.
 * 출력은 사람이 읽기 좋은 마크다운 가까운 평문.
 */
export function buildScheduleText(items: TripItem[], opts: BuildOpts = {}): string {
  const currency = normalizeCurrency(opts.currency, 'KRW')
  const confirmed = items
    .filter((i) => i.trip_priority === '확정' && i.date)
    .sort((a, b) => {
      const ak = dateKey(a)
      const bk = dateKey(b)
      if (ak !== bk) return ak < bk ? -1 : 1
      const at = a.time_start ?? ''
      const bt = b.time_start ?? ''
      return at < bt ? -1 : at > bt ? 1 : 0
    })

  const lines: string[] = []
  if (opts.tripTitle) {
    lines.push(`# ${opts.tripTitle}`)
    if (opts.startDate && opts.endDate) {
      lines.push(`${opts.startDate} – ${opts.endDate}`)
    }
    lines.push('')
  }

  if (confirmed.length === 0) {
    lines.push('(확정된 일정이 없어요)')
    return lines.join('\n')
  }

  let prevDate = ''
  for (const it of confirmed) {
    const d = it.date as string
    if (d !== prevDate) {
      if (prevDate) lines.push('')
      lines.push(dayHeader(d))
      prevDate = d
    }
    const time = formatTime(it.time_start)
    const endTime = formatTime(it.time_end)
    const timeStr = time ? (endTime ? `${time}–${endTime}` : time) : ''
    const budget =
      typeof it.budget === 'number' && it.budget > 0
        ? ` (${formatBudget(it.budget, currency as never)})`
        : ''
    const where = it.address ? ` — ${it.address}` : ''
    const head = timeStr ? `${timeStr} ${it.name}` : it.name
    lines.push(`- ${head}${where}${budget}`)
  }

  return lines.join('\n')
}
