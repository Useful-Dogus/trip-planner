import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0D9488',
          borderRadius: '22%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="62%" height="62%" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 6C12.134 6 9 9.134 9 13C9 18.25 16 26 16 26C16 26 23 18.25 23 13C23 9.134 19.866 6 16 6ZM16 16C14.343 16 13 14.657 13 13C13 11.343 14.343 10 16 10C17.657 10 19 11.343 19 13C19 14.657 17.657 16 16 16Z"
            fill="white"
          />
        </svg>
      </div>
    ),
    size,
  )
}
