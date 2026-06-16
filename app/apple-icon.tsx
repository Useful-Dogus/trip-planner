import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#16243F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="62%" height="62%" viewBox="0 0 32 32" fill="none">
          <circle cx="9.5" cy="22.5" r="2.6" fill="#C6A04E" />
          <circle cx="22.5" cy="9.5" r="2.6" fill="#C6A04E" />
          <path
            d="M9.5 22.5 C 9.5 14 22.5 18 22.5 9.5"
            stroke="#C6A04E"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    size,
  )
}
