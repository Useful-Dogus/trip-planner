import { NextRequest, NextResponse } from 'next/server'
import { geocodeAddress, reverseGeocode } from '@/lib/geocode'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  const lat = request.nextUrl.searchParams.get('lat')
  const lng = request.nextUrl.searchParams.get('lng')

  try {
    if (lat && lng) {
      const latN = parseFloat(lat)
      const lngN = parseFloat(lng)
      if (!Number.isFinite(latN) || !Number.isFinite(lngN)) {
        return NextResponse.json({ error: '잘못된 좌표' }, { status: 400 })
      }
      const result = await reverseGeocode(latN, lngN)
      if (!result) return NextResponse.json({ address: null })
      return NextResponse.json(result)
    }
    if (!q) {
      return NextResponse.json({ error: 'q 또는 lat/lng 파라미터가 필요합니다.' }, { status: 400 })
    }
    const result = await geocodeAddress(q)
    if (!result) return NextResponse.json({ lat: null, lng: null })
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: '지오코딩 서비스 오류' }, { status: 500 })
  }
}
