'use client'

import { create } from 'zustand'
import {
  emptyAuthSession,
  readAuthSession,
  signOutCurrentUser,
  type AuthClaims,
  type AuthSessionSnapshot,
} from '@/lib/auth'

type AuthStore = AuthSessionSnapshot & {
  isHydrating: boolean
  hydrate: (forceRefresh?: boolean) => Promise<AuthSessionSnapshot>
  clear: () => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  ...emptyAuthSession(),
  isHydrating: true,
  hydrate: async (forceRefresh = false) => {
    set({ isHydrating: true })
    const session = await readAuthSession(forceRefresh)
    set({ ...session, isHydrating: false })
    return session
  },
  clear: () => set({ ...emptyAuthSession(), isHydrating: false }),
  signOut: async () => {
    await signOutCurrentUser()
    set({ ...emptyAuthSession(), isHydrating: false })
  },
}))

export function getClaimString(claims: AuthClaims | null, key: string): string | null {
  const value = claims?.[key]
  return typeof value === 'string' ? value : null
}
