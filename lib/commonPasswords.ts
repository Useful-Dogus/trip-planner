/**
 * 서버 측 최소 방어선(NIST 800-63B): 길이 + 흔한/유출 비밀번호 차단.
 * 복잡도 강제(특수문자 필수 등)는 하지 않는다 — 길이 우선 + 흔한 비번 거부.
 * 전수 유출 DB 대조는 별도(후속); 여기서는 가장 흔한 비번을 인라인으로 막는다.
 */
const COMMON_PASSWORDS = new Set(
  [
    '12345678',
    '123456789',
    '1234567890',
    'password',
    'password1',
    'password123',
    'qwerty123',
    'qwertyuiop',
    '11111111',
    '00000000',
    '12341234',
    'abcd1234',
    'a1234567',
    '1q2w3e4r',
    '1q2w3e4r5t',
    'asdf1234',
    'zxcvbnm1',
    'iloveyou',
    'admin123',
    'letmein1',
    'welcome1',
    'monkey12',
    'dragon123',
    'sunshine1',
    'football1',
    'baseball1',
    'trustno1',
    'starwars1',
    'whatever1',
    'superman1',
    'michael1',
    'princess1',
    'passw0rd',
    'p@ssw0rd',
    'qazwsxedc',
    '87654321',
    '147258369',
    '11223344',
    'samsung1',
    'galaxy123',
  ].map((p) => p.toLowerCase()),
)

/** 흔한 비밀번호이면 true. 대소문자 무시. */
export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.has(password.toLowerCase())
}
