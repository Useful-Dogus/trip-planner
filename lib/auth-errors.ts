import type { AuthError } from '@supabase/supabase-js'

export type AuthErrorCode =
  | 'email_not_confirmed'
  | 'rate_limit'
  | 'weak_password'
  | 'invalid_credentials'
  | 'generic'

export interface MappedAuthError {
  code: AuthErrorCode
  message: string
}

/**
 * Supabase AuthError → 사용자 메시지 매핑.
 * 계정 enumeration 방지를 위해 호출부에서 invalid_credentials/generic 은
 * 동일 메시지로 응답해야 한다.
 */
export function mapAuthError(
  error: AuthError | null | undefined,
): MappedAuthError {
  if (!error) {
    return { code: 'generic', message: '요청을 처리하지 못했습니다.' }
  }

  const code = (error as { code?: string }).code
  const status = (error as { status?: number }).status
  const msg = error.message ?? ''

  if (code === 'email_not_confirmed' || /not.*confirm/i.test(msg)) {
    return {
      code: 'email_not_confirmed',
      message: '이메일 확인이 필요합니다. 메일함에서 확인 링크를 눌러주세요.',
    }
  }

  if (
    status === 429 ||
    code === 'over_request_rate_limit' ||
    code === 'over_email_send_rate_limit' ||
    /rate.?limit/i.test(msg)
  ) {
    return {
      code: 'rate_limit',
      message: '요청이 잠시 차단되었어요. 잠시 후 다시 시도해주세요.',
    }
  }

  if (
    code === 'weak_password' ||
    /password.*(short|weak|too.?short|at least)/i.test(msg)
  ) {
    return {
      code: 'weak_password',
      message: '비밀번호가 너무 짧거나 약해요. 8자 이상으로 설정해주세요.',
    }
  }

  return {
    code: 'invalid_credentials',
    message: '이메일 또는 비밀번호가 올바르지 않습니다.',
  }
}
