'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { completeHostedUiCallback } from '@/lib/auth'
import { useAuthStore } from '@/store/auth-store'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hydrate = useAuthStore((state) => state.hydrate)

  useEffect(() => {
    const next = searchParams.get('next') || '/'

    completeHostedUiCallback(window.location.href)
      .then(() => hydrate(true))
      .then((session) => {
        if (session.isAuthenticated) {
          router.replace(next)
          router.refresh()
          return
        }

        router.replace('/auth/login')
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : 'Unable to finish login')
        router.replace('/auth/login')
      })
  }, [hydrate, router, searchParams])

  return (
    <div className='flex min-h-[calc(100vh-8rem)] items-center justify-center text-sm text-muted-foreground'>
      Completing sign in...
    </div>
  )
}
