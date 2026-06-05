'use client'

import { Suspense } from 'react'
import { SWRProvider } from '@/lib/providers/SWRProvider'
import { ToastProvider } from '@/components/UI/Toast'
import { ConfirmProvider } from '@/components/UI/ConfirmDialog'
import { ThemeProvider } from '@/components/Theme/ThemeProvider'
import OfflineBanner from '@/components/UI/OfflineBanner'
import AuthStateSync from '@/components/Auth/AuthStateSync'
import TopProgressBar from '@/components/Layout/TopProgressBar'
import KeyboardShortcuts from '@/components/Layout/KeyboardShortcuts'
import AvatarDropdown from '@/components/Layout/AvatarDropdown'
import WebVitalsReporter from '@/components/Layout/WebVitalsReporter'

export default function Providers({
  children,
  userId,
}: {
  children: React.ReactNode
  userId: string | null
}) {
  return (
    <ThemeProvider>
      {/* key 에 userId 를 박아 사용자 전환 시 SWRProvider 가 리마운트되며
          새 cache provider 가 만들어진다 — 이전 user 의 in-memory 캐시는 폐기. */}
      <SWRProvider key={userId ?? 'anon'} userId={userId}>
        <AuthStateSync initialUserId={userId} />
        <ToastProvider>
          <ConfirmProvider>
            {/* Suspense boundary 는 TopProgressBar 가 향후 useSearchParams 등을
                추가할 때 정적 렌더링 bail-out 을 막기 위한 안전 장치. */}
            <Suspense fallback={null}>
              <TopProgressBar />
            </Suspense>
            <Suspense fallback={null}>
              <WebVitalsReporter />
            </Suspense>
            <KeyboardShortcuts />
            <AvatarDropdown />
            <OfflineBanner />
            {children}
          </ConfirmProvider>
        </ToastProvider>
      </SWRProvider>
    </ThemeProvider>
  )
}
