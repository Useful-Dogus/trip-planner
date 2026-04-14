import type { Metadata } from 'next'
import './globals.css'
import 'leaflet/dist/leaflet.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'NYC Trip Planner',
  description: '뉴욕 여행 플래너',
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'NYC Trip Planner',
    description: '뉴욕 여행 플래너',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-white text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
