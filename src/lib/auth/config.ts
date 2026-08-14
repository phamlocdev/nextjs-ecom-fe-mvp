import 'server-only'

const DEFAULT_SESSION_COOKIE_NAME = 'dynamodb_mvp_session'
const DEFAULT_ROTATION_BUFFER_MS = 5 * 60 * 1000
const DEFAULT_REFRESH_TTL_DAYS = 30
const DEFAULT_AUTH_RETURN_PATH = '/admin'
const DEFAULT_CALLBACK_PATH = '/auth/hosted-ui/callback'
const DEFAULT_LOGOUT_PATH = '/auth/login'

export type AuthConfig = {
  clientId: string
  region: string
  userPoolId: string
  sessionSecret: string
  sessionCookieName: string
  refreshBufferMs: number
  refreshTokenTtlDays: number
  cognitoDomainUrl?: string
  cognitoApiEndpoint?: string
  hostedUiCallbackUrl: string
  logoutRedirectUrl: string
  defaultReturnTo: string
}

export function getAuthConfig(): AuthConfig {
  const clientId = process.env.COGNITO_CLIENT_ID?.trim()
  const region = process.env.COGNITO_REGION?.trim()
  const userPoolId = process.env.COGNITO_USER_POOL_ID?.trim()
  const sessionSecret = process.env.SESSION_SECRET?.trim()

  if (!clientId || !region || !userPoolId || !sessionSecret) {
    throw new Error('Missing Cognito or session environment variables.')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000'
  const hostedUiCallbackUrl =
    process.env.COGNITO_HOSTED_UI_CALLBACK_URL?.trim() || `${appUrl}${DEFAULT_CALLBACK_PATH}`
  const logoutRedirectUrl =
    process.env.COGNITO_LOGOUT_REDIRECT_URL?.trim() || `${appUrl}${DEFAULT_LOGOUT_PATH}`
  const refreshBufferMs = Number(process.env.COGNITO_REFRESH_BUFFER_MS ?? DEFAULT_ROTATION_BUFFER_MS)
  const refreshTokenTtlDays = Number(
    process.env.COGNITO_REFRESH_TOKEN_TTL_DAYS ?? DEFAULT_REFRESH_TTL_DAYS,
  )

  return {
    clientId,
    region,
    userPoolId,
    sessionSecret,
    sessionCookieName: process.env.SESSION_COOKIE_NAME?.trim() || DEFAULT_SESSION_COOKIE_NAME,
    refreshBufferMs:
      Number.isFinite(refreshBufferMs) && refreshBufferMs > 0
        ? refreshBufferMs
        : DEFAULT_ROTATION_BUFFER_MS,
    refreshTokenTtlDays:
      Number.isFinite(refreshTokenTtlDays) && refreshTokenTtlDays > 0
        ? refreshTokenTtlDays
        : DEFAULT_REFRESH_TTL_DAYS,
    cognitoDomainUrl: normalizeUrl(process.env.COGNITO_DOMAIN_URL),
    cognitoApiEndpoint: normalizeUrl(process.env.COGNITO_API_ENDPOINT),
    hostedUiCallbackUrl,
    logoutRedirectUrl,
    defaultReturnTo: DEFAULT_AUTH_RETURN_PATH,
  }
}

export function getCognitoIssuer(): string {
  const config = getAuthConfig()
  return `https://cognito-idp.${config.region}.amazonaws.com/${config.userPoolId}`
}

export function getCognitoAuthorizeEndpoint(): string {
  if (isLocalStackCognito()) {
    return 'https://localhost.localstack.cloud/_aws/cognito-idp/login'
  }

  const domainUrl = getRequiredCognitoDomainUrl()
  return `${domainUrl}/oauth2/authorize`
}

export function getCognitoTokenEndpoint(): string {
  if (isLocalStackCognito()) {
    return `${getRequiredCognitoApiEndpoint()}/_aws/cognito-idp/oauth2/token`
  }

  const domainUrl = getRequiredCognitoDomainUrl()
  return `${domainUrl}/oauth2/token`
}

export function getCognitoLogoutEndpoint(): string {
  if (isLocalStackCognito()) {
    return `${getRequiredCognitoApiEndpoint()}/_aws/cognito-idp/logout`
  }

  const domainUrl = getRequiredCognitoDomainUrl()
  return `${domainUrl}/logout`
}

export function getCognitoIdentityProviderEndpoint(): string {
  const config = getAuthConfig()
  return config.cognitoApiEndpoint ?? `https://cognito-idp.${config.region}.amazonaws.com/`
}

function getRequiredCognitoDomainUrl(): string {
  const domainUrl = getAuthConfig().cognitoDomainUrl
  if (!domainUrl) {
    throw new Error('COGNITO_DOMAIN_URL is required for Hosted UI flows.')
  }
  return domainUrl
}

function getRequiredCognitoApiEndpoint(): string {
  const apiEndpoint = getAuthConfig().cognitoApiEndpoint
  if (!apiEndpoint) {
    throw new Error('COGNITO_API_ENDPOINT is required for LocalStack Cognito flows.')
  }
  return apiEndpoint
}

function isLocalStackCognito(): boolean {
  const apiEndpoint = getAuthConfig().cognitoApiEndpoint
  if (!apiEndpoint) {
    return false
  }

  return (
    apiEndpoint.includes('localhost:4566') ||
    apiEndpoint.includes('127.0.0.1:4566') ||
    apiEndpoint.includes('localstack.cloud') ||
    apiEndpoint.includes('host.docker.internal:4566')
  )
}

function normalizeUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) {
    return undefined
  }

  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed
}
