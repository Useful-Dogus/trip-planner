import type { Metadata } from 'next'
import './globals.css'
import 'leaflet/dist/leaflet.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'Trip Planner',
  description: '지도와 함께 만드는 여행 계획',
  icons: {
    icon: '/icon.svg',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-bg text-fg font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
