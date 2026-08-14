import 'server-only'

import { redirect } from 'next/navigation'
import { ensureFreshAccessToken } from './cognito'
import { getAuthConfig } from './config'

export async function getCurrentSessionSummary(): Promise<{
  userLabel: string
  roleLabel: string
  groups: string[]
} | null> {
  const session = await ensureFreshAccessToken()
  if (!session) {
    return null
  }

  return {
    userLabel: session.user.email ?? session.user.username,
    roleLabel: session.user.groups.join(', ') || 'authenticated',
    groups: session.user.groups,
  }
}

export async function requireAdminSession(returnTo: string): Promise<{
  userLabel: string
  roleLabel: string
}> {
  const session = await getCurrentSessionSummary()
  if (!session) {
    redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`)
  }

  if (!hasAdminAccess(session.groups)) {
    redirect('/customer/products')
  }

  return {
    userLabel: session.userLabel,
    roleLabel: session.roleLabel,
  }
}

export function normalizeReturnTo(value: string | null | undefined): string {
  const fallback = getAuthConfig().defaultReturnTo
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback
  }

  return value
}

function hasAdminAccess(groups: string[]): boolean {
  return groups.includes('admin') || groups.includes('manager')
}
