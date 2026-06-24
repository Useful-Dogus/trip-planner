import { useEffect } from 'react'

/**
 * `active` 동안 탭 닫기·새로고침·외부 URL 이동 시 브라우저 기본 이탈 확인 다이얼로그를 띄운다.
 * 장기 실행 작업(예: 구글맵 200개 일괄 추가, #324) 도중 실수로 페이지를 벗어나
 * 진행이 끊기는 것을 막는다.
 *
 * 주의: SPA 내부 라우팅(Link 클릭)에는 `beforeunload` 가 발화하지 않는다 — 그 경우
 * 진행 중이던 fetch 는 백그라운드에서 계속 완료되므로(서버 삽입은 원자적) 데이터 손실이
 * 없다. 데이터가 깨지는 경우는 문서 언로드(닫기/새로고침/외부 이동)뿐이라 여기서만 막는다.
 */
export function useBeforeUnload(active: boolean) {
  useEffect(() => {
    if (!active) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // 일부 브라우저는 returnValue 가 설정돼야 다이얼로그를 띄운다(문구는 브라우저가 무시).
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [active])
}
