import 'server-only'

import { createHash, randomBytes } from 'crypto'
import type { AuthMethod, AuthSession, UserSummary } from '@/lib/types'
import {
  getAuthConfig,
  getCognitoAuthorizeEndpoint,
  getCognitoIdentityProviderEndpoint,
  getCognitoLogoutEndpoint,
  getCognitoTokenEndpoint,
} from './config'
import { clearSession, readSession, writeSession } from './session'
import { withSessionRefreshLock } from './session-lock'

export type HostedUiTransaction = {
  state: string
  codeVerifier: string
  returnTo: string
}

export function createHostedUiLoginUrl(returnTo: string): {
  url: string
  transaction: HostedUiTransaction
} {
  const config = getAuthConfig()
  const state = randomBytes(16).toString('hex')
  const codeVerifier = randomBytes(32).toString('base64url')
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')
  const url = new URL(getCognitoAuthorizeEndpoint())

  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', config.clientId)
  url.searchParams.set('redirect_uri', config.hostedUiCallbackUrl)
  url.searchParams.set('scope', 'openid email profile')
  url.searchParams.set('state', state)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('code_challenge', codeChallenge)

  return {
    url: url.toString(),
    transaction: { state, codeVerifier, returnTo },
  }
}

export async function exchangeHostedUiCode(input: {
  code: string
  state: string
  transaction: HostedUiTransaction
}): Promise<AuthSession> {
  if (input.state !== input.transaction.state) {
    throw new Error('Invalid OAuth state.')
  }

  const config = getAuthConfig()
  const response = await fetch(getCognitoTokenEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      code: input.code,
      redirect_uri: config.hostedUiCallbackUrl,
      code_verifier: input.transaction.codeVerifier,
    }),
    cache: 'no-store',
  })

  const payload = (await response.json()) as TokenResponse & {
    error?: string
    error_description?: string
  }
  if (!response.ok || !payload.access_token || !payload.id_token || !payload.refresh_token) {
    throw new Error(
      payload.error_description ?? payload.error ?? 'Hosted UI token exchange failed.',
    )
  }

  const session = createSessionFromTokens(payload, 'hosted-ui')
  await writeSession(session)
  return session
}

export async function signInWithPassword(input: {
  username: string
  password: string
}): Promise<AuthSession> {
  const config = getAuthConfig()
  const response = await fetch(getCognitoIdentityProviderEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
    },
    body: JSON.stringify({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: config.clientId,
      AuthParameters: {
        USERNAME: input.username,
        PASSWORD: input.password,
      },
    }),
    cache: 'no-store',
  })

  const payload = (await response.json()) as InitiateAuthResponse
  const result = payload.AuthenticationResult
  if (!response.ok || !result?.AccessToken || !result.IdToken || !result.RefreshToken) {
    throw new Error(resolveCognitoError(payload) ?? 'Username or password is invalid.')
  }

  console.log('>>>>>>>> AT: ', result?.AccessToken)

  const session = createSessionFromTokens(
    {
      access_token: result.AccessToken,
      id_token: result.IdToken,
      refresh_token: result.RefreshToken,
      expires_in: result.ExpiresIn,
      token_type: result.TokenType ?? 'Bearer',
    },
    'custom',
  )
  await writeSession(session)
  return session
}

export async function signUpWithPassword(input: {
  username: string
  password: string
  email: string
}): Promise<void> {
  const config = getAuthConfig()
  const response = await fetch(getCognitoIdentityProviderEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp',
    },
    body: JSON.stringify({
      ClientId: config.clientId,
      Username: input.username,
      Password: input.password,
      UserAttributes: [{ Name: 'email', Value: input.email }],
    }),
    cache: 'no-store',
  })

  const payload = (await response.json()) as CognitoMutationResponse
  if (!response.ok) {
    throw new Error(resolveCognitoError(payload) ?? 'Unable to create your account.')
  }
}

export async function confirmUserSignUp(input: { username: string; code: string }): Promise<void> {
  const config = getAuthConfig()
  const response = await fetch(getCognitoIdentityProviderEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.ConfirmSignUp',
    },
    body: JSON.stringify({
      ClientId: config.clientId,
      Username: input.username,
      ConfirmationCode: input.code,
    }),
    cache: 'no-store',
  })

  const payload = (await response.json()) as CognitoMutationResponse
  if (!response.ok) {
    throw new Error(resolveCognitoError(payload) ?? 'Confirmation code is invalid.')
  }
}

export async function resendSignUpCode(username: string): Promise<void> {
  const config = getAuthConfig()
  const response = await fetch(getCognitoIdentityProviderEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.ResendConfirmationCode',
    },
    body: JSON.stringify({
      ClientId: config.clientId,
      Username: username,
    }),
    cache: 'no-store',
  })

  const payload = (await response.json()) as CognitoMutationResponse
  if (!response.ok) {
    throw new Error(resolveCognitoError(payload) ?? 'Unable to resend the confirmation code.')
  }
}

export async function ensureFreshAccessToken(): Promise<AuthSession | null> {
  const session = await readSession()
  if (!session) {
    return null
  }

  const buffer = getAuthConfig().refreshBufferMs
  if (Date.now() < session.accessTokenExpiresAt - buffer) {
    return session
  }

  return withSessionRefreshLock(session.refreshToken, async () => {
    const latest = await readSession()
    if (!latest) {
      return null
    }
    if (Date.now() < latest.accessTokenExpiresAt - buffer) {
      return latest
    }

    try {
      const refreshed = await refreshSession(latest)
      await writeSession(refreshed)
      return refreshed
    } catch {
      await clearSession()
      return null
    }
  })
}

export async function buildHostedUiLogoutUrl(): Promise<string | null> {
  const session = await readSession()
  if (!session || session.authMethod !== 'hosted-ui') {
    return null
  }

  const config = getAuthConfig()
  const url = new URL(getCognitoLogoutEndpoint())
  url.searchParams.set('client_id', config.clientId)
  url.searchParams.set('logout_uri', config.logoutRedirectUrl)
  return url.toString()
}

function createSessionFromTokens(tokens: TokenResponse, authMethod: AuthMethod): AuthSession {
  const config = getAuthConfig()
  const accessPayload = parseJwtPayload(tokens.access_token)
  const idPayload = parseJwtPayload(tokens.id_token)
  const now = Date.now()
  const accessTokenExpiresAt = resolveExpiry(accessPayload.exp, now + tokens.expires_in * 1000)
  const idTokenExpiresAt = resolveExpiry(idPayload.exp, accessTokenExpiresAt)
  const refreshTokenExpiresAt = now + config.refreshTokenTtlDays * 24 * 60 * 60 * 1000

  return {
    authMethod,
    accessToken: tokens.access_token,
    idToken: tokens.id_token,
    refreshToken: tokens.refresh_token,
    accessTokenExpiresAt,
    idTokenExpiresAt,
    refreshTokenExpiresAt,
    user: toUserSummary(accessPayload, idPayload),
  }
}

async function refreshSession(session: AuthSession): Promise<AuthSession> {
  const config = getAuthConfig()
  const response = await fetch(getCognitoIdentityProviderEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.GetTokensFromRefreshToken',
    },
    body: JSON.stringify({
      ClientId: config.clientId,
      RefreshToken: session.refreshToken,
    }),
    cache: 'no-store',
  })

  const payload = (await response.json()) as GetTokensFromRefreshTokenResponse
  const result = payload.AuthenticationResult
  if (!response.ok || !result?.AccessToken || !result.IdToken) {
    throw new Error(resolveCognitoError(payload) ?? 'Failed to refresh session.')
  }

  return createSessionFromTokens(
    {
      access_token: result.AccessToken,
      id_token: result.IdToken,
      refresh_token: result.RefreshToken ?? session.refreshToken,
      expires_in: result.ExpiresIn,
      token_type: result.TokenType ?? 'Bearer',
    },
    session.authMethod,
  )
}

function parseJwtPayload(token: string): Record<string, unknown> {
  const [, payload = ''] = token.split('.')
  const json = Buffer.from(payload, 'base64url').toString('utf8')
  return JSON.parse(json) as Record<string, unknown>
}

function resolveExpiry(expClaim: unknown, fallback: number): number {
  return typeof expClaim === 'number' ? expClaim * 1000 : fallback
}

function toUserSummary(
  accessPayload: Record<string, unknown>,
  idPayload: Record<string, unknown>,
): UserSummary {
  return {
    sub: String(accessPayload.sub ?? idPayload.sub ?? ''),
    username: String(accessPayload.username ?? idPayload['cognito:username'] ?? ''),
    email: typeof idPayload.email === 'string' ? idPayload.email : undefined,
    groups: readGroups(accessPayload, idPayload),
  }
}

function readGroups(
  accessPayload: Record<string, unknown>,
  idPayload: Record<string, unknown>,
): string[] {
  const source = accessPayload['cognito:groups'] ?? idPayload['cognito:groups']
  return Array.isArray(source)
    ? source.filter((item): item is string => typeof item === 'string')
    : []
}

function resolveCognitoError(payload: Record<string, unknown>): string | null {
  if (typeof payload.message === 'string') {
    return payload.message
  }
  if (typeof payload.Message === 'string') {
    return payload.Message
  }
  if (typeof payload.__type === 'string') {
    return payload.__type.split('#').pop() ?? payload.__type
  }
  return null
}

type TokenResponse = {
  access_token: string
  id_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

type InitiateAuthResponse = {
  AuthenticationResult?: {
    AccessToken?: string
    IdToken?: string
    RefreshToken?: string
    ExpiresIn: number
    TokenType?: string
  }
  __type?: string
  message?: string
  Message?: string
}

type GetTokensFromRefreshTokenResponse = {
  AuthenticationResult?: {
    AccessToken?: string
    IdToken?: string
    RefreshToken?: string
    ExpiresIn: number
    TokenType?: string
  }
  __type?: string
  message?: string
  Message?: string
}

type CognitoMutationResponse = {
  __type?: string
  message?: string
  Message?: string
}
