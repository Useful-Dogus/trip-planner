'use client'

import { SWRProvider } from '@/lib/providers/SWRProvider'
import { ToastProvider } from '@/components/UI/Toast'
import { ConfirmProvider } from '@/components/UI/ConfirmDialog'
import { ThemeProvider } from '@/components/Theme/ThemeProvider'
import OfflineBanner from '@/components/UI/OfflineBanner'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SWRProvider>
        <ToastProvider>
          <ConfirmProvider>
            <OfflineBanner />
            {children}
          </ConfirmProvider>
        </ToastProvider>
      </SWRProvider>
    </ThemeProvider>
  )
}
