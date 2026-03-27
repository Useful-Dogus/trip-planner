'use client'

import { SWRProvider } from '@/lib/providers/SWRProvider'
import { ToastProvider } from '@/components/UI/Toast'
import OfflineBanner from '@/components/UI/OfflineBanner'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRProvider>
      <ToastProvider>
        <OfflineBanner />
        {children}
      </ToastProvider>
    </SWRProvider>
  )
}
