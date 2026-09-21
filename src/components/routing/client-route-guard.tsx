'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Permission, hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/store/auth-store'

const setPasswordRoute = '/auth/set-password'
const protectedRoutes = [setPasswordRoute, '/customer/profile', '/cart', '/checkout', '/orders']
const adminRoutes = ['/admin']
const adminRoutePermissions: Record<string, Permission> = {
  '/admin/products': Permission.PRODUCTS_READ,
  '/admin/inventories': Permission.INVENTORIES_READ,
  '/admin/categories': Permission.CATEGORIES_READ,
  '/admin/orders': Permission.ORDERS_READ,
  '/admin/users/login-audit': Permission.USERS_LOGIN_AUDIT_READ,
  '/admin/users': Permission.USERS_READ,
}
const guestRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/confirm',
  '/auth/forgot-password',
  '/auth/hosted-login',
]

export function ClientRouteGuard() {
  const pathname = usePathname()
  const router = useRouter()
  const { accessTokenClaims, idTokenClaims, isAuthenticated, isHydrating } = useAuthStore()

  useEffect(() => {
    if (isHydrating) {
      return
    }

    const search = typeof window === 'undefined' ? '' : window.location.search
    const isProtectedRoute = matchesAnyRoute(pathname, protectedRoutes)
    const isAdminRoute = matchesAnyRoute(pathname, adminRoutes)
    const isGuestRoute = matchesAnyRoute(pathname, guestRoutes)

    if (isProtectedRoute && !isAuthenticated) {
      router.replace(`/auth/login?next=${encodeURIComponent(`${pathname}${search}`)}`)
      return
    }

    if (
      isAuthenticated &&
      requiresPasswordSetup(idTokenClaims, accessTokenClaims) &&
      pathname !== setPasswordRoute &&
      pathname !== '/auth/callback'
    ) {
      router.replace(`${setPasswordRoute}?next=${encodeURIComponent(`${pathname}${search}`)}`)
      return
    }

    if (isAdminRoute && !hasAdminRouteAccess(pathname, idTokenClaims, accessTokenClaims)) {
      router.replace('/')
      return
    }

    if (isGuestRoute && isAuthenticated) {
      router.replace('/')
    }
  }, [accessTokenClaims, idTokenClaims, isAuthenticated, isHydrating, pathname, router])

  return null
}

function matchesAnyRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

function hasAdminRouteAccess(
  pathname: string,
  idTokenClaims: Record<string, unknown> | null,
  accessTokenClaims: Record<string, unknown> | null,
): boolean {
  if (!hasRole(idTokenClaims, ['admin', 'manager'])) {
    return false
  }

  const entry = Object.entries(adminRoutePermissions).find(
    ([route]) => pathname === route || pathname.startsWith(`${route}/`),
  )

  if (!entry) {
    return true
  }

  return hasPermission(accessTokenClaims, entry[1])
}

function requiresPasswordSetup(
  idTokenClaims: Record<string, unknown> | null,
  accessTokenClaims: Record<string, unknown> | null,
): boolean {
  return (
    idTokenClaims?.['app:password_status'] === 'REQUIRED' ||
    accessTokenClaims?.['app:password_status'] === 'REQUIRED'
  )
}

function hasRole(claims: Record<string, unknown> | null, roles: string[]): boolean {
  const groups = claims?.['cognito:groups']
  const directRole = claims?.role ?? claims?.['custom:role']

  if (
    Array.isArray(groups) &&
    groups.some((value) => roles.includes(String(value).toLowerCase()))
  ) {
    return true
  }

  return typeof directRole === 'string' && roles.includes(directRole.toLowerCase())
}
