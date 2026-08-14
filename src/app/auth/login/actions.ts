'use server'

import { redirect } from 'next/navigation'
import { signInWithPassword } from '@/lib/auth/cognito'
import { normalizeReturnTo } from '@/lib/auth/server'

export async function loginWithPasswordAction(formData: FormData): Promise<void> {
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const returnTo = normalizeReturnTo(String(formData.get('returnTo') ?? ''))

  if (!username || !password) {
    redirect(
      `/auth/login?error=${encodeURIComponent('Username and password are required.')}&returnTo=${encodeURIComponent(returnTo)}`,
    )
  }

  try {
    await signInWithPassword({ username, password })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to sign in.'
    redirect(
      `/auth/login?error=${encodeURIComponent(message)}&returnTo=${encodeURIComponent(returnTo)}`,
    )
  }

  redirect(returnTo)
}
