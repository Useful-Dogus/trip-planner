import { cn } from '@/lib/cn'

/**
 * 제품명 단일 소스. 이름 변경 시 이 상수 한 곳만 바꾸면 모든 표면에 반영된다.
 * (브랜드 정본: docs/brand.md — 이슈 #231)
 */
export const PRODUCT_NAME = 'Waypost'

/**
 * 제품 이익 한 문장 — "왜 쓰는가 = 무엇을 얻는가" (이슈 #258·#289).
 * 기능 나열·협업 강조 대신, 사용자가 얻는 결과만 말한다.
 * 보이스 규칙(design-guidelines §11): 사람처럼·짧게, 부정추상('안 깨지는')·
 * PM 관점 동사('동선을 깎다') 대신 사용자 체감 결과로 적는다.
 */
export const PRODUCT_TAGLINE = '가 보고 싶은 곳을 모아, 하루 일정으로 정리해요'

type WordmarkSize = 'sm' | 'md' | 'lg'

const SIZES: Record<WordmarkSize, { box: string; icon: string; text: string; gap: string }> = {
  sm: { box: 'size-6', icon: 'size-3.5', text: 'text-base', gap: 'gap-1.5' },
  md: { box: 'size-8', icon: 'size-[18px]', text: 'text-xl', gap: 'gap-2' },
  lg: { box: 'size-11', icon: 'size-6', text: 'text-2xl', gap: 'gap-2.5' },
}

/**
 * Waypost 전용 글리프 — 두 웨이포인트(점)를 잇는 곡선 경로(동선·이정표 모티프).
 * favicon(app/icon.svg)·앱 아이콘과 동일한 형상을 단일 소스로 제공한다.
 * `currentColor` 를 쓰므로 부모의 text 색(브라스 등)을 그대로 따른다.
 */
export function WaypostGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <circle cx="9.5" cy="22.5" r="2.6" fill="currentColor" />
      <circle cx="22.5" cy="9.5" r="2.6" fill="currentColor" />
      <path
        d="M9.5 22.5 C 9.5 14 22.5 18 22.5 9.5"
        stroke="currentColor"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * 동선·이정표 모티프(Waypost 전용 글리프)를 브라스 원형 테두리 안에 둔 브랜드 마크.
 * favicon 과 동일한 글리프를 쓴다. 아이콘 단독으로 쓸 때는 `aria-label` 을 부모가 제공한다.
 */
export function BrandMark({ size = 'md', className }: { size?: WordmarkSize; className?: string }) {
  const s = SIZES[size]
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border-2 border-accent text-accent shrink-0',
        s.box,
        className,
      )}
    >
      <WaypostGlyph className={s.icon} />
    </span>
  )
}

interface WordmarkProps {
  size?: WordmarkSize
  /** 마크만 표시하고 텍스트는 숨김 (아이콘 단독). */
  iconOnly?: boolean
  className?: string
}

/**
 * Waypost 워드마크: 마크 + 제품명. 헤더·로그인·빈 상태 등 브랜드 노출 표면에 사용.
 */
export default function Wordmark({ size = 'md', iconOnly = false, className }: WordmarkProps) {
  const s = SIZES[size]
  return (
    <span
      className={cn('inline-flex items-center', s.gap, className)}
      aria-label={iconOnly ? PRODUCT_NAME : undefined}
    >
      <BrandMark size={size} />
      {!iconOnly && (
        <span className={cn('font-semibold tracking-tight text-fg', s.text)}>{PRODUCT_NAME}</span>
      )}
    </span>
  )
}
