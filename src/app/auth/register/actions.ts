'use server'

import { redirect } from 'next/navigation'
import { confirmUserSignUp, resendSignUpCode, signUpWithPassword } from '@/lib/auth/cognito'
import { normalizeReturnTo } from '@/lib/auth/server'

export async function registerWithPasswordAction(formData: FormData): Promise<void> {
  const username = String(formData.get('username') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')
  const returnTo = normalizeReturnTo(String(formData.get('returnTo') ?? ''))

  if (!username || !email || !password || !confirmPassword) {
    redirect(
      `/auth/register?error=${encodeURIComponent('All registration fields are required.')}&returnTo=${encodeURIComponent(returnTo)}`,
    )
  }

  if (password !== confirmPassword) {
    redirect(
      `/auth/register?error=${encodeURIComponent('Passwords do not match.')}&returnTo=${encodeURIComponent(returnTo)}`,
    )
  }

  try {
    await signUpWithPassword({ username, email, password })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create your account.'
    redirect(
      `/auth/register?error=${encodeURIComponent(message)}&returnTo=${encodeURIComponent(returnTo)}`,
    )
  }

  redirect(
    `/auth/register/confirm?username=${encodeURIComponent(username)}&returnTo=${encodeURIComponent(returnTo)}`,
  )
}

export async function confirmRegistrationAction(formData: FormData): Promise<void> {
  const username = String(formData.get('username') ?? '').trim()
  const code = String(formData.get('code') ?? '').trim()
  const returnTo = normalizeReturnTo(String(formData.get('returnTo') ?? ''))

  if (!username || !code) {
    redirect(
      `/auth/register/confirm?username=${encodeURIComponent(username)}&error=${encodeURIComponent('Username and confirmation code are required.')}&returnTo=${encodeURIComponent(returnTo)}`,
    )
  }

  try {
    await confirmUserSignUp({ username, code })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Confirmation failed.'
    redirect(
      `/auth/register/confirm?username=${encodeURIComponent(username)}&error=${encodeURIComponent(message)}&returnTo=${encodeURIComponent(returnTo)}`,
    )
  }

  redirect(
    `/auth/login?message=${encodeURIComponent('Your account has been confirmed. Sign in to continue.')}&returnTo=${encodeURIComponent(returnTo)}`,
  )
}

export async function resendRegistrationCodeAction(formData: FormData): Promise<void> {
  const username = String(formData.get('username') ?? '').trim()
  const returnTo = normalizeReturnTo(String(formData.get('returnTo') ?? ''))

  if (!username) {
    redirect(
      `/auth/register/confirm?error=${encodeURIComponent('Username is required to resend the confirmation code.')}&returnTo=${encodeURIComponent(returnTo)}`,
    )
  }

  try {
    await resendSignUpCode(username)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to resend the confirmation code.'
    redirect(
      `/auth/register/confirm?username=${encodeURIComponent(username)}&error=${encodeURIComponent(message)}&returnTo=${encodeURIComponent(returnTo)}`,
    )
  }

  redirect(
    `/auth/register/confirm?username=${encodeURIComponent(username)}&message=${encodeURIComponent('A new confirmation code has been sent.')}&returnTo=${encodeURIComponent(returnTo)}`,
  )
}
