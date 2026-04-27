import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SpinnerProps {
  size?: number
  className?: string
  label?: string
}

export default function Spinner({ size = 16, className, label = '불러오는 중' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-flex items-center justify-center text-fg-muted', className)}
    >
      <Loader2 className="animate-spin" style={{ width: size, height: size }} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  )
}
