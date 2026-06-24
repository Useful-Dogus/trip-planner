import { mutate as globalMutate } from 'swr'

/** trip 목록 SWR 키 — 문자열 리터럴 산재 방지를 위한 단일 소스. */
export const TRIPS_KEY = '/api/trips'

/**
 * trip 목록을 바꾼 뒤(생성·수정·삭제·중심 변경) 호출한다.
 * SWR 메모리 캐시(globalMutate)와 Next.js Router 캐시(router.refresh)를 **함께**
 * 무효화한다 — 둘 중 하나라도 빠뜨리면 대시보드 RSC(initialTrips)가 재검증되지
 * 않아 stale 목록이 보인다(#296). 그래서 두 동작을 한 헬퍼로 묶어 빠뜨릴 수 없게 한다.
 */
export async function invalidateTrips(router: { refresh: () => void }) {
  await globalMutate(TRIPS_KEY)
  router.refresh()
}
