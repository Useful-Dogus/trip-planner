import { NextResponse } from 'next/server'
import { getSession, signOut } from '@/lib/auth'
import { createRouteHandlerSupabase } from '@/lib/supabase-server'
import { createAdminSupabase } from '@/lib/supabase-admin'

/**
 * 회원 탈퇴(계정 삭제) — 즉시·영구 삭제(#321).
 *
 * 정책(현재): 단독 소유 여행은 계정과 함께 즉시 삭제한다. 복구/유예 기간 없음.
 * `auth.users` 행을 admin API 로 삭제하면 스키마의 `on delete cascade` 로
 * 소유 trips → items·trip_members·shares·votes 가 연쇄 삭제된다.
 * 다른 사람이 소유한 공유 여행은 내 trip_members 행만 삭제되고 여행 자체는 남는다.
 *
 * NOTE(후속 #321 정책 확장): 멀티유저 공유가 본격화되면 "소유자 탈퇴 시 공유 여행
 * 소유권 이전" 정책이 필요하다. 현재는 단일 사용자 전제라 즉시 삭제로 단순화.
 */

/** 사전 고지용: 탈퇴 시 함께 삭제될 '내가 소유한 여행' 개수. */
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }
  const supabase = createRouteHandlerSupabase()
  const { count } = await supabase
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .eq('owner_user_id', session.userId)
  return NextResponse.json({ ownedTripCount: count ?? 0 })
}

/** 계정 즉시 삭제 실행. */
export async function DELETE() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  let admin
  try {
    admin = createAdminSupabase()
  } catch {
    return NextResponse.json(
      { error: '서버에 탈퇴 처리가 구성되지 않았습니다. 관리자에게 문의해주세요.' },
      { status: 500 },
    )
  }

  const { error } = await admin.auth.admin.deleteUser(session.userId)
  if (error) {
    console.error('[delete-account] deleteUser failed:', error)
    return NextResponse.json({ error: '계정 삭제에 실패했습니다.' }, { status: 500 })
  }

  // 세션 쿠키 정리(이미 무효지만 명시적으로).
  try {
    await signOut()
  } catch {
    // 쿠키 정리 실패는 치명적이지 않음 — 클라이언트가 하드 리로드로 정리한다.
  }

  return NextResponse.json({ ok: true })
}
