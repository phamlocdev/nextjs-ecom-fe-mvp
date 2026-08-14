import { NextResponse } from 'next/server'
import { clearHostedUiTransaction, readHostedUiTransaction } from '@/lib/auth/oauth-transaction'
import { exchangeHostedUiCode } from '@/lib/auth/cognito'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')
  const transaction = await readHostedUiTransaction()

  if (error) {
    await clearHostedUiTransaction()
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error)}`, request.url),
    )
  }

  if (!code || !state || !transaction) {
    await clearHostedUiTransaction()
    return NextResponse.redirect(
      new URL('/auth/login?error=Missing%20OAuth%20callback%20state.', request.url),
    )
  }

  try {
    await exchangeHostedUiCode({ code, state, transaction })
    await clearHostedUiTransaction()
    return NextResponse.redirect(new URL(transaction.returnTo, request.url))
  } catch (caughtError) {
    await clearHostedUiTransaction()
    const message = caughtError instanceof Error ? caughtError.message : 'Hosted UI sign-in failed.'
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(message)}`, request.url),
    )
  }
}
