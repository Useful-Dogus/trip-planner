import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import LoginForm from './LoginForm'

export default async function LoginPage() {
  // T034: 이미 로그인된 경우 /research 로 리다이렉트
  const token = cookies().get('auth')?.value
  if (token && (await verifyToken(token))) {
    redirect('/research')
  }

  return <LoginForm />
}
