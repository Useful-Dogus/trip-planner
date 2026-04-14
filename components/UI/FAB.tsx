'use client'

import { useRouter } from 'next/navigation'

export default function FAB() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push('/items/new')}
      aria-label="새 항목 추가"
      className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-gray-900 text-white shadow-lg flex items-center justify-center hover:bg-gray-700 active:bg-gray-800 transition-colors"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  )
}
