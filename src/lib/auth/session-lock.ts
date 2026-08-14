import 'server-only'

import { createHash } from 'crypto'
import type { AuthSession } from '@/lib/types'

const inFlightRefreshes = new Map<string, Promise<AuthSession | null>>()

export function withSessionRefreshLock(
  refreshToken: string,
  refreshOperation: () => Promise<AuthSession | null>,
): Promise<AuthSession | null> {
  const lockKey = createHash('sha256').update(refreshToken).digest('hex')
  const existing = inFlightRefreshes.get(lockKey)
  if (existing) {
    return existing
  }

  const promise = refreshOperation().finally(() => {
    inFlightRefreshes.delete(lockKey)
  })
  inFlightRefreshes.set(lockKey, promise)
  return promise
}
