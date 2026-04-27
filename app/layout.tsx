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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-bg text-fg font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
