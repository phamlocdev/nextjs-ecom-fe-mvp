import { NextResponse, type NextRequest } from 'next/server'

// const protectedRoutes = ['/', '/products', '/admin']
const adminRoutes = ['/admin']
const guestRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/confirm',
  '/auth/forgot-password',
  '/auth/hosted-login',
]

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  // const isProtectedRoute = protectedRoutes.some(
  //   (route) => pathname === route || (route !== '/' && pathname.startsWith(`${route}/`)),
  // )
  const isAdminRoute = adminRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
  const isGuestRoute = guestRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
  const authPayloads = getValidCognitoTokenPayloads(request)
  const isAuthenticated = authPayloads.length > 0

  // if (isProtectedRoute && !isAuthenticated) {
  //   const loginUrl = new URL('/auth/login', request.url)
  //   loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
  //   return NextResponse.redirect(loginUrl)
  // }

  if (isAdminRoute && !hasRole(authPayloads, ['admin', 'manager'])) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (isGuestRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}

type JwtPayload = {
  exp?: number
  role?: string
  'custom:role'?: string
  'cognito:groups'?: string[]
}

function getValidCognitoTokenPayloads(request: NextRequest): JwtPayload[] {
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
  const tokenCookies = request.cookies.getAll().filter((cookie) => {
    const name = decodeURIComponent(cookie.name)
    return (
      (!clientId || name.includes(clientId)) &&
      (name.endsWith('.accessToken') || name.endsWith('.idToken'))
    )
  })

  return tokenCookies
    .map((cookie) => decodeJwtPayload(cookie.value))
    .filter((payload): payload is JwtPayload =>
      Boolean(payload?.exp && payload.exp * 1000 > Date.now()),
    )
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) {
      return null
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const decoded =
      typeof atob === 'function' ? atob(padded) : Buffer.from(padded, 'base64').toString('binary')

    return JSON.parse(decoded) as JwtPayload
  } catch {
    return null
  }
}

function hasRole(payloads: JwtPayload[], roles: string[]): boolean {
  return payloads.some((payload) => {
    const groups = payload['cognito:groups']
    const directRole = payload.role ?? payload['custom:role']

    if (Array.isArray(groups) && groups.some((value) => roles.includes(value.toLowerCase()))) {
      return true
    }

    return typeof directRole === 'string' && roles.includes(directRole.toLowerCase())
  })
}
