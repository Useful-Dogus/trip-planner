'use client'

import { SWRProvider } from '@/lib/providers/SWRProvider'
import { ToastProvider } from '@/components/UI/Toast'
import { ThemeProvider } from '@/components/Theme/ThemeProvider'
import OfflineBanner from '@/components/UI/OfflineBanner'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SWRProvider>
        <ToastProvider>
          <OfflineBanner />
          {children}
        </ToastProvider>
      </SWRProvider>
    </ThemeProvider>
  )
}
