import type { Metadata } from 'next'
import './globals.css'
import 'leaflet/dist/leaflet.css'
import Providers from './providers'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'

export const metadata: Metadata = {
  title: 'Trip Planner',
  description: '지도와 함께 만드는 여행 계획',
  applicationName: 'Trip Planner',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Trip Planner',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Trip Planner',
    description: '지도와 함께 만드는 여행 계획',
    type: 'website',
  },
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1020' },
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
