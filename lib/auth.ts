import type { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareSupabase, createRouteHandlerSupabase } from './supabase-server'

export type AuthSession = {
  userId: string
  email: string | null
} | null

export async function getSessionFromMiddleware(
  request: NextRequest,
  response: NextResponse,
): Promise<AuthSession> {
  const supabase = createMiddlewareSupabase(request, response)
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null
  return { userId: data.user.id, email: data.user.email ?? null }
}

export async function getSession(): Promise<AuthSession> {
  const supabase = createRouteHandlerSupabase()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null
  return { userId: data.user.id, email: data.user.email ?? null }
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession()
  return session?.userId ?? null
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createRouteHandlerSupabase()
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUpWithEmail(email: string, password: string, emailRedirectTo: string) {
  const supabase = createRouteHandlerSupabase()
  return supabase.auth.signUp({ email, password, options: { emailRedirectTo } })
}

export async function signOut() {
  const supabase = createRouteHandlerSupabase()
  return supabase.auth.signOut()
}

export async function requestPasswordReset(email: string, redirectTo: string) {
  const supabase = createRouteHandlerSupabase()
  return supabase.auth.resetPasswordForEmail(email, { redirectTo })
}

export async function updatePassword(password: string) {
  const supabase = createRouteHandlerSupabase()
  return supabase.auth.updateUser({ password })
}

export async function exchangeCodeForSession(code: string) {
  const supabase = createRouteHandlerSupabase()
  return supabase.auth.exchangeCodeForSession(code)
}
