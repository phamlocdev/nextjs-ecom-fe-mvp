import { NextResponse } from 'next/server'
import { buildHostedUiLogoutUrl } from '@/lib/auth/cognito'
import { clearSession } from '@/lib/auth/session'

export async function GET(request: Request) {
  const hostedUiLogoutUrl = await buildHostedUiLogoutUrl()
  await clearSession()

  if (hostedUiLogoutUrl) {
    return NextResponse.redirect(hostedUiLogoutUrl)
  }

  return NextResponse.redirect(new URL('/auth/login', request.url))
}
