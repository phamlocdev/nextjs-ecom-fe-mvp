import { NextResponse } from 'next/server'
import { createHostedUiLoginUrl } from '@/lib/auth/cognito'
import { writeHostedUiTransaction } from '@/lib/auth/oauth-transaction'
import { normalizeReturnTo } from '@/lib/auth/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const returnTo = normalizeReturnTo(url.searchParams.get('returnTo'))
  const { url: loginUrl, transaction } = createHostedUiLoginUrl(returnTo)
  await writeHostedUiTransaction(transaction)
  return NextResponse.redirect(loginUrl)
}
