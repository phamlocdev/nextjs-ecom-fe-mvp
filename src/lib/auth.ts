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
  await signInWithRedirect()
}

export async function redirectToGoogle(): Promise<void> {
  configureAmplify()
  await signInWithRedirect({ provider: 'Google' })
}

export async function signOutCurrentUser(): Promise<void> {
  configureAmplify()
  await signOut()
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
