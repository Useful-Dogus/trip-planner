import type { Metadata } from 'next'
import './globals.css'
import 'leaflet/dist/leaflet.css'
import Providers from './providers'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'

export const metadata: Metadata = {
  title: 'Waypost',
  description: '지도 위에서 후보를 모아 동선을 직접 깎는 여행 설계 도구',
  applicationName: 'Waypost',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Waypost',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Waypost',
    description: '지도 위에서 후보를 모아 동선을 직접 깎는 여행 설계 도구',
    type: 'website',
  },
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f6f8' },
    { media: '(prefers-color-scheme: dark)', color: '#121821' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

/**
 * 초기 렌더 깜빡임 방지: <head> 안에서 동기적으로 저장된 테마를 읽어 dark 클래스를 적용.
 * React hydration 전에 실행되어야 하므로 inline script 사용.
 */
const themeInitScript = `
(function(){
  try {
    var saved = localStorage.getItem('trip-planner.theme') || 'system';
    var dark = saved === 'dark' || (saved === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // 클라이언트 SWR 캐시를 user-scope 로 격리하기 위해 root 에서 user id 를 1회 읽어
  // Providers 에 prop 으로 내려준다. 인증되지 않은 경로(/login, /signup 등) 도 안전.
  let userId: string | null = null
  try {
    const client = createRouteHandlerSupabase()
    const { data } = await client.auth.getUser()
    userId = data.user?.id ?? null
  } catch {
    userId = null
  }

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-bg text-fg font-sans antialiased">
        <Providers userId={userId}>{children}</Providers>
      </body>
    </html>
  )
}
