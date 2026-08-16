export const env = {
  apiGatewayBaseUrl: readRequiredEnv(
    'NEXT_PUBLIC_API_GATEWAY_BASE_URL',
    process.env.NEXT_PUBLIC_API_GATEWAY_BASE_URL,
  ),
  cognitoRegion: readRequiredEnv(
    'NEXT_PUBLIC_COGNITO_REGION',
    process.env.NEXT_PUBLIC_COGNITO_REGION,
  ),
  cognitoUserPoolId: readRequiredEnv(
    'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
  ),
  cognitoClientId: readRequiredEnv(
    'NEXT_PUBLIC_COGNITO_CLIENT_ID',
    process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
  ),
  cognitoDomainUrl: readRequiredEnv(
    'NEXT_PUBLIC_COGNITO_DOMAIN_URL',
    process.env.NEXT_PUBLIC_COGNITO_DOMAIN_URL,
  ),
  cognitoUserPoolEndpoint:
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ENDPOINT || 'http://localhost.localstack.cloud:4566',
}

function readRequiredEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}
