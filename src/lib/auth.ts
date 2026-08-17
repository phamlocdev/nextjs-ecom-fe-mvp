'use client'

import { Amplify } from 'aws-amplify'
import {
  confirmResetPassword,
  confirmSignUp,
  fetchAuthSession,
  getCurrentUser,
  resetPassword,
  signIn,
  signInWithRedirect,
  signOut,
  signUp,
  type JWT,
} from 'aws-amplify/auth'
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito'
import { CookieStorage } from 'aws-amplify/utils'
import { env } from '@/lib/env'

let configured = false

export type AuthClaims = Record<string, unknown>

export type AuthSessionSnapshot = {
  isAuthenticated: boolean
  username: string | null
  userId: string | null
  idTokenClaims: AuthClaims | null
  accessTokenClaims: AuthClaims | null
}

export type SignInInput = {
  username: string
  password: string
}

export type SignUpInput = {
  username: string
  email: string
  password: string
}

export type ConfirmSignUpInput = {
  username: string
  confirmationCode: string
}

export type ForgotPasswordInput = {
  username: string
}

export type ConfirmForgotPasswordInput = {
  username: string
  confirmationCode: string
  newPassword: string
}

type HostedUiProvider = 'Google'

type StoredHostedUiState = {
  state: string
  codeVerifier: string
}

type OAuthTokenResponse = {
  access_token: string
  id_token?: string
  refresh_token?: string
}

const hostedUiStorageKey = 'localstack-hosted-ui'

export function configureAmplify(): void {
  if (configured || typeof window === 'undefined') {
    return
  }

  const domain = env.cognitoDomainUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const origin = window.location.origin

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: env.cognitoUserPoolId,
        userPoolClientId: env.cognitoClientId,
        userPoolEndpoint: env.cognitoUserPoolEndpoint,
        signUpVerificationMethod: 'code',
        loginWith: {
          email: true,
          username: true,
          oauth: {
            domain,
            scopes: ['openid', 'email', 'profile'],
            redirectSignIn: [`${origin}/auth/callback`],
            redirectSignOut: [`${origin}/auth/login`],
            responseType: 'code',
          },
        },
      },
    },
  })

  cognitoUserPoolsTokenProvider.setKeyValueStorage(
    new CookieStorage({
      sameSite: 'lax',
      path: '/',
      expires: 30,
      secure: window.location.protocol === 'https:',
    }),
  )

  configured = true
}

export async function readAuthSession(forceRefresh = false): Promise<AuthSessionSnapshot> {
  configureAmplify()

  try {
    const [currentUser, session] = await Promise.all([
      getCurrentUser(),
      fetchAuthSession({ forceRefresh }),
    ])

    return {
      isAuthenticated: Boolean(session.tokens?.accessToken),
      username: currentUser.username,
      userId: currentUser.userId,
      idTokenClaims: tokenPayload(session.tokens?.idToken),
      accessTokenClaims: tokenPayload(session.tokens?.accessToken),
    }
  } catch {
    return emptyAuthSession()
  }
}

export async function getAccessToken(forceRefresh = false): Promise<string | null> {
  configureAmplify()

  try {
    const session = await fetchAuthSession({ forceRefresh })
    return session.tokens?.accessToken?.toString() ?? null
  } catch {
    return null
  }
}

export async function signInWithPassword(input: SignInInput): Promise<void> {
  configureAmplify()
  await signIn({ username: input.username, password: input.password })
}

export async function signUpWithEmail(input: SignUpInput): Promise<void> {
  configureAmplify()
  await signUp({
    username: input.username,
    password: input.password,
    options: {
      userAttributes: {
        email: input.email,
      },
    },
  })
}

export async function confirmUserSignUp(input: ConfirmSignUpInput): Promise<void> {
  configureAmplify()
  await confirmSignUp({
    username: input.username,
    confirmationCode: input.confirmationCode,
  })
}

export async function requestPasswordReset(input: ForgotPasswordInput): Promise<void> {
  configureAmplify()
  await resetPassword({ username: input.username })
}

export async function confirmPasswordReset(input: ConfirmForgotPasswordInput): Promise<void> {
  configureAmplify()
  await confirmResetPassword({
    username: input.username,
    confirmationCode: input.confirmationCode,
    newPassword: input.newPassword,
  })
}

export async function redirectToHostedUi(): Promise<void> {
  configureAmplify()

  if (isLocalStackHostedUi()) {
    await redirectToLocalStackHostedUi()
    return
  }

  await signInWithRedirect()
}

export async function redirectToGoogle(): Promise<void> {
  configureAmplify()

  if (isLocalStackHostedUi()) {
    await redirectToLocalStackHostedUi('Google')
    return
  }

  await signInWithRedirect({ provider: 'Google' })
}

export async function signOutCurrentUser(): Promise<void> {
  configureAmplify()
  await signOut()
}

export async function completeHostedUiCallback(url: string): Promise<boolean> {
  configureAmplify()

  if (!isLocalStackHostedUi() || typeof window === 'undefined') {
    return false
  }

  const currentUrl = new URL(url)
  const code = currentUrl.searchParams.get('code')
  const state = currentUrl.searchParams.get('state')

  if (!code || !state) {
    return false
  }

  const storedState = loadHostedUiState()
  if (!storedState) {
    throw new Error('Hosted login session was not found. Please try again.')
  }

  if (storedState.state !== state) {
    clearHostedUiState()
    throw new Error('Hosted login state is invalid. Please try again.')
  }

  const tokenResponse = await exchangeLocalStackHostedUiCode({
    code,
    codeVerifier: storedState.codeVerifier,
    redirectUri: `${window.location.origin}/auth/callback`,
  })

  await storeHostedUiTokens(tokenResponse)
  clearHostedUiState()

  return true
}

export function emptyAuthSession(): AuthSessionSnapshot {
  return {
    isAuthenticated: false,
    username: null,
    userId: null,
    idTokenClaims: null,
    accessTokenClaims: null,
  }
}

function tokenPayload(token?: JWT): AuthClaims | null {
  return token?.payload ? { ...token.payload } : null
}

function isLocalStackHostedUi(): boolean {
  return env.cognitoUserPoolEndpoint.includes('localhost')
}

async function redirectToLocalStackHostedUi(provider?: HostedUiProvider): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  const redirectUri = `${window.location.origin}/auth/callback`
  const state = generateRandomString(32)
  const codeVerifier = generateRandomString(64)
  const codeChallenge = await createCodeChallenge(codeVerifier)
  const authorizeUrl = new URL(`${trimTrailingSlash(env.cognitoUserPoolEndpoint)}/_aws/cognito-idp/oauth2/authorize`)

  authorizeUrl.searchParams.set('client_id', env.cognitoClientId)
  authorizeUrl.searchParams.set('redirect_uri', redirectUri)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('scope', 'openid email profile')
  authorizeUrl.searchParams.set('state', state)
  authorizeUrl.searchParams.set('code_challenge', codeChallenge)
  authorizeUrl.searchParams.set('code_challenge_method', 'S256')

  if (provider) {
    authorizeUrl.searchParams.set('identity_provider', provider)
  }

  storeHostedUiState({ state, codeVerifier })
  window.location.assign(authorizeUrl.toString())
}

async function exchangeLocalStackHostedUiCode(input: {
  code: string
  codeVerifier: string
  redirectUri: string
}): Promise<OAuthTokenResponse> {
  const tokenEndpoint = `${trimTrailingSlash(env.cognitoUserPoolEndpoint)}/_aws/cognito-idp/oauth2/token`
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: env.cognitoClientId,
    code: input.code,
    redirect_uri: input.redirectUri,
    code_verifier: input.codeVerifier,
  })

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    throw new Error(await readOAuthError(response))
  }

  return (await response.json()) as OAuthTokenResponse
}

async function storeHostedUiTokens(tokens: OAuthTokenResponse): Promise<void> {
  const accessToken = decodeJwt(tokens.access_token)
  const idToken = tokens.id_token ? decodeJwt(tokens.id_token) : undefined
  const username =
    (idToken?.payload['cognito:username'] as string | undefined) ??
    (accessToken.payload.username as string | undefined) ??
    (accessToken.payload.sub as string | undefined)

  if (!username) {
    throw new Error('Hosted login completed but no username was returned by Cognito.')
  }

  const issuedAt = typeof accessToken.payload.iat === 'number' ? accessToken.payload.iat * 1000 : 0
  const clockDrift = issuedAt > 0 ? issuedAt - Date.now() : 0

  await cognitoUserPoolsTokenProvider.tokenOrchestrator.setTokens({
    tokens: {
      accessToken,
      idToken,
      refreshToken: tokens.refresh_token,
      clockDrift,
      username,
    },
  })
}

function decodeJwt(token: string): JWT {
  const [, payload = ''] = token.split('.')
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4 || 4)) % 4), '=')
  const json = JSON.parse(atob(padded)) as Record<string, unknown>

  return {
    payload: json,
    toString: () => token,
  } as JWT
}

async function createCodeChallenge(codeVerifier: string): Promise<string> {
  const data = new TextEncoder().encode(codeVerifier)
  const digest = await crypto.subtle.digest('SHA-256', data)

  return toBase64Url(new Uint8Array(digest))
}

function generateRandomString(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return toBase64Url(bytes).slice(0, length)
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function storeHostedUiState(state: StoredHostedUiState): void {
  sessionStorage.setItem(hostedUiStorageKey, JSON.stringify(state))
}

function loadHostedUiState(): StoredHostedUiState | null {
  const value = sessionStorage.getItem(hostedUiStorageKey)
  return value ? (JSON.parse(value) as StoredHostedUiState) : null
}

function clearHostedUiState(): void {
  sessionStorage.removeItem(hostedUiStorageKey)
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, '')
}

async function readOAuthError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string; error_description?: string }
    return data.error_description || data.error || 'Unable to complete hosted login'
  } catch {
    return 'Unable to complete hosted login'
  }
}
