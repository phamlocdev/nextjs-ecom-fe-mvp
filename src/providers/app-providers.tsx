'use client'

import { useEffect, useMemo, type ReactNode } from 'react'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { QueryClient, QueryClientProvider } from 'react-query'
import { configureAmplify } from '@/lib/auth'
import { useAuthStore } from '@/store/auth-store'

export function AppProviders({ children }: { children: ReactNode }) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
    [],
  )
  const hydrate = useAuthStore((state) => state.hydrate)

  useEffect(() => {
    configureAmplify()
    void hydrate()
  }, [hydrate])

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </NuqsAdapter>
  )
}
