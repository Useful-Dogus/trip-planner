import type { Status } from '@/types'

const styles: Record<Status, string> = {
  검토중: 'bg-blue-100 text-blue-700',
  보류: 'bg-gray-100 text-gray-600',
  대기중: 'bg-yellow-100 text-yellow-700',
  확정: 'bg-emerald-100 text-emerald-700',
  탈락: 'bg-red-100 text-red-400',
}

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  )
}
