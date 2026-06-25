import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import type { TripPulseSummary } from '@/lib/tripPulse'
import { cn } from '@/lib/cn'

interface TripPulseProps {
  summary: TripPulseSummary
  className?: string
}

export default function TripPulse({ summary, className }: TripPulseProps) {
  return (
    <section
      aria-label="여행 상태"
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm shadow-e1',
        className,
      )}
    >
      <p className="min-w-0 flex items-center gap-2 text-fg">
        <Sparkles className="size-4 flex-shrink-0 text-accent" aria-hidden="true" />
        <span className="leading-5">{summary.title}</span>
      </p>
      {summary.action && (
        <Link
          href={summary.action.href}
          className={cn(
            'inline-flex flex-shrink-0 items-center gap-1 rounded px-2 py-1 text-xs font-medium text-accent',
            'hover:bg-accent-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          )}
        >
          {summary.action.label}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      )}
    </section>
  )
}
