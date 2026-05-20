import { redirect } from 'next/navigation'
import { buildTripPath } from '@/lib/hooks/useTripContext'

/**
 * /trip/[tripId] 진입 시 기본 뷰(map) 로 리다이렉트.
 * 멤버 권한 검증은 layout.tsx 에서 이미 수행됨.
 */
export default function TripRootPage({ params }: { params: { tripId: string } }) {
  redirect(buildTripPath(params.tripId, 'map'))
}
