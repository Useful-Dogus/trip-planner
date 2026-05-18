import { NextRequest, NextResponse } from 'next/server'
import { geocodeAddress } from '@/lib/geocode'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  if (!q) {
    return NextResponse.json({ error: 'q 파라미터가 필요합니다.' }, { status: 400 })
  }

  try {
    const result = await geocodeAddress(q)
    if (!result) return NextResponse.json({ lat: null, lng: null })
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: '지오코딩 서비스 오류' }, { status: 500 })
  }
}
