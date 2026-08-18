'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { redirectToHostedUi } from '@/lib/auth'

export default function HostedLoginPage() {
  useEffect(() => {
    redirectToHostedUi().catch((error) => {
      toast.error(error instanceof Error ? error.message : 'Unable to start hosted login')
    })
  }, [])

  return (
    <div className='flex min-h-[calc(100vh-8rem)] items-center justify-center text-sm text-muted-foreground'>
      Redirecting to Cognito...
    </div>
  )
}
