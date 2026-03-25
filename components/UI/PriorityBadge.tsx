import type { Priority } from '@/types'

const styles: Record<Priority, string> = {
  반드시: 'bg-rose-50 text-rose-600 ring-1 ring-rose-200',
  들를만해: 'bg-orange-50 text-orange-600 ring-1 ring-orange-200',
  '시간 남으면': 'bg-gray-50 text-gray-400 ring-1 ring-gray-200',
}

const dots: Record<Priority, string> = {
  반드시: 'bg-rose-500',
  들를만해: 'bg-orange-400',
  '시간 남으면': 'bg-gray-300',
}

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[priority]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dots[priority]}`} />
      {priority}
    </span>
  )
}
