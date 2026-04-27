'use client'

import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    setOffline(!navigator.onLine)
    const handleOnline = () => setOffline(false)
    const handleOffline = () => setOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-[1200] bg-warning-bg border-b border-warning-border px-4 py-2 flex items-center justify-center gap-2 text-xs text-warning-fg"
    >
      <WifiOff className="size-3.5" aria-hidden="true" />
      <span>오프라인 상태입니다. 캐시된 데이터를 보고 있어요.</span>
    </div>
  )
}
