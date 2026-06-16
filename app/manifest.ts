import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Waypost',
    short_name: 'Waypost',
    description: '지도 위에서 후보를 모아 동선을 직접 깎는 여행 설계 도구',
    lang: 'ko',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f4f6f8',
    theme_color: '#97762f',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/icon0', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon1', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon2', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
