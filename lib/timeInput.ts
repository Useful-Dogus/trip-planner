export type TimeInputResult =
  | { status: 'empty'; value: null }
  | { status: 'complete'; value: string }
  | { status: 'partial'; message: string }
  | { status: 'invalid'; message: string }

const TIME_MESSAGE = '시간은 08:00 또는 0800처럼 입력해주세요.'
const PARTIAL_MESSAGE = '시간을 끝까지 입력해주세요. 예: 08:00'

function toTime(hourText: string, minuteText: string): TimeInputResult {
  const hour = Number(hourText)
  const minute = Number(minuteText)
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour > 23 || minute > 59) {
    return { status: 'invalid', message: TIME_MESSAGE }
  }
  return {
    status: 'complete',
    value: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
  }
}

export function normalizeTimeInput(input: string): TimeInputResult {
  const value = input.trim()
  if (!value) return { status: 'empty', value: null }

  const colon = value.match(/^(\d{1,2}):(\d{2})$/)
  if (colon) return toTime(colon[1], colon[2])

  const compact = value.match(/^(\d{3,4})$/)
  if (compact) {
    const raw = compact[1]
    return toTime(raw.slice(0, -2), raw.slice(-2))
  }

  if (/^\d{1,2}:?$/.test(value)) return { status: 'partial', message: PARTIAL_MESSAGE }

  return { status: 'invalid', message: TIME_MESSAGE }
}

export function normalizeTimeField(body: Record<string, unknown>, field: string): string | null {
  const raw = body[field]
  if (raw === undefined || raw === null) return null
  if (typeof raw !== 'string') return TIME_MESSAGE

  const result = normalizeTimeInput(raw)
  if (result.status === 'empty') {
    body[field] = null
    return null
  }
  if (result.status === 'complete') {
    body[field] = result.value
    return null
  }
  return result.message
}
