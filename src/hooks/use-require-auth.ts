'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'

export function useRequireAuth() {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isHydrating } = useAuthStore()

  useEffect(() => {
    if (!isHydrating && !isAuthenticated) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [isAuthenticated, isHydrating, pathname, router])

  return {
    isAuthenticated,
    isHydrating,
  }
}
