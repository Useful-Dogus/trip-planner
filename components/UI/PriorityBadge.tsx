import type { Priority } from '@/types'

const styles: Record<Priority, string> = {
  반드시: 'bg-rose-100 text-rose-700',
  들를만해: 'bg-orange-100 text-orange-700',
  '시간 남으면': 'bg-gray-100 text-gray-500',
}

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[priority]}`}
    >
      {priority}
    </span>
  )
}
