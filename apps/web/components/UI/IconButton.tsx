import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'ghost' | 'subtle' | 'solid'
type Size = 'sm' | 'md' | 'lg'

const VARIANT: Record<Variant, string> = {
  ghost: 'bg-transparent text-fg-muted hover:bg-bg-subtle hover:text-fg active:bg-border',
  subtle: 'bg-bg-subtle text-fg hover:bg-border',
  solid: 'bg-accent text-accent-fg hover:bg-accent-hover',
}

/**
 * - sm: 32px (시각), 클릭 영역은 부모에서 보장
 * - md: 40px (모바일에서도 44px 보장하려면 lg 권장)
 * - lg: 44px (모바일 표준 hit area)
 */
const SIZE: Record<Size, string> = {
  sm: 'size-8 rounded',
  md: 'size-10 rounded-lg',
  lg: 'size-11 rounded-lg',
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** 시각적 라벨이 없으므로 필수 */
  'aria-label': string
  children: ReactNode
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'ghost', size = 'md', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center shrink-0',
        'transition-colors duration-150 ease-out-soft',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:text-fg-subtle disabled:cursor-not-allowed disabled:hover:bg-transparent',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    />
  )
})

export default IconButton
