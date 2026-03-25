import type { Status } from '@/types'

const styles: Record<Status, string> = {
  검토중: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  보류: 'bg-gray-50 text-gray-500 ring-1 ring-gray-200',
  대기중: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  확정: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  탈락: 'bg-rose-50 text-rose-500 ring-1 ring-rose-200',
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
