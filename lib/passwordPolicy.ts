import { isCommonPassword } from '@/lib/commonPasswords'
import { estimateStrength, type StrengthResult } from '@/lib/passwordStrength'

export const MIN_PASSWORD_LENGTH = 8
export const MIN_ACCEPTED_PASSWORD_SCORE: StrengthResult['score'] = 2

export interface PasswordPolicyResult {
  ok: boolean
  message?: string
  score?: StrengthResult['score']
}

export async function validatePasswordPolicy(password: string): Promise<PasswordPolicyResult> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, message: '비밀번호는 8자 이상이어야 합니다.' }
  }

  if (isCommonPassword(password)) {
    return {
      ok: false,
      message: '너무 흔한 비밀번호예요. 추측하기 어려운 비밀번호로 바꿔주세요.',
    }
  }

  const { score } = await estimateStrength(password)
  if (score < MIN_ACCEPTED_PASSWORD_SCORE) {
    return {
      ok: false,
      score,
      message: '비밀번호가 너무 약합니다. 더 길거나 추측하기 어려운 조합을 사용해주세요.',
    }
  }

  return { ok: true, score }
}
