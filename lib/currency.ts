/**
 * Trip 단위 통화 표시·포맷팅.
 * 기존 USD 고정에서 벗어나기 위한 헬퍼.
 */

export type CurrencyCode =
  | 'KRW'
  | 'USD'
  | 'JPY'
  | 'EUR'
  | 'GBP'
  | 'CNY'
  | 'THB'
  | 'VND'
  | 'TWD'
  | 'HKD'
  | 'SGD'
  | 'AUD'
  | 'CAD'

export const SUPPORTED_CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'KRW', label: '대한민국 원', symbol: '₩' },
  { code: 'JPY', label: '일본 엔', symbol: '¥' },
  { code: 'USD', label: '미국 달러', symbol: '$' },
  { code: 'EUR', label: '유로', symbol: '€' },
  { code: 'GBP', label: '영국 파운드', symbol: '£' },
  { code: 'CNY', label: '중국 위안', symbol: '¥' },
  { code: 'THB', label: '태국 바트', symbol: '฿' },
  { code: 'VND', label: '베트남 동', symbol: '₫' },
  { code: 'TWD', label: '대만 달러', symbol: 'NT$' },
  { code: 'HKD', label: '홍콩 달러', symbol: 'HK$' },
  { code: 'SGD', label: '싱가포르 달러', symbol: 'S$' },
  { code: 'AUD', label: '호주 달러', symbol: 'A$' },
  { code: 'CAD', label: '캐나다 달러', symbol: 'C$' },
]

const ZERO_DECIMAL: CurrencyCode[] = ['KRW', 'JPY', 'VND']

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && SUPPORTED_CURRENCIES.some(c => c.code === value)
}

export function normalizeCurrency(value: unknown, fallback: CurrencyCode = 'KRW'): CurrencyCode {
  return isCurrencyCode(value) ? value : fallback
}

export function formatBudget(value: number, currency: CurrencyCode = 'KRW'): string {
  const decimals = ZERO_DECIMAL.includes(currency) ? 0 : 2
  try {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency,
      maximumFractionDigits: decimals,
      minimumFractionDigits: 0,
    }).format(value)
  } catch {
    const meta = SUPPORTED_CURRENCIES.find(c => c.code === currency)
    const sym = meta?.symbol ?? ''
    return `${sym}${Math.round(value).toLocaleString('ko-KR')}`
  }
}

/** 입력 placeholder 등에 쓰는 통화 심볼. */
export function currencySymbol(currency: CurrencyCode = 'KRW'): string {
  return SUPPORTED_CURRENCIES.find(c => c.code === currency)?.symbol ?? ''
}

/** 라벨 (입력 필드 등). 예: "예산 (₩)" */
export function currencyFieldLabel(prefix: string, currency: CurrencyCode = 'KRW'): string {
  return `${prefix} (${currencySymbol(currency)})`
}

/**
 * Trip 통화에서 home 통화로 환산 후 포맷.
 * homeCurrency 또는 rate 가 없거나, fromCurrency === homeCurrency 면 null.
 */
export function formatHomeConversion(
  amount: number,
  fromCurrency: CurrencyCode,
  homeCurrency: CurrencyCode | null,
  rate: number | null,
): string | null {
  if (!homeCurrency || !rate || rate <= 0) return null
  if (fromCurrency === homeCurrency) return null
  const converted = amount * rate
  return formatBudget(converted, homeCurrency)
}
