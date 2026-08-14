export type ProductStatus = 'ACTIVE' | 'INACTIVE'

export type Product = {
  productId: string
  name: string
  description: string
  categoryId: string
  price: number
  currency: string
  imageUrl?: string
  status: ProductStatus
  createdAt: string
  updatedAt: string
}

export type Category = {
  categoryId: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 200] as const
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]
export const DEFAULT_PAGE_SIZE: PageSize = 10

export type PaginationParams = {
  limit?: PageSize
  cursor?: string
  categoryId?: string
  status?: ProductStatus
  minPrice?: number
  maxPrice?: number
  updatedFrom?: string
  updatedTo?: string
  q?: string
}

export type ProductFilterParams = Omit<PaginationParams, 'limit' | 'cursor'>

export type PaginatedResponse<T> = {
  items: T[]
  previousCursor: string | null
  nextCursor: string | null
  limit: PageSize
  currentPage: number
  scannedCount?: number
}

export type ApiErrorPayload = {
  statusCode?: number
  message?: string | string[]
  error?: string
}

export type AuthMethod = 'custom' | 'hosted-ui'

export type UserSummary = {
  sub: string
  username: string
  email?: string
  groups: string[]
}

export type ManagedUser = {
  username: string
  enabled: boolean
  status?: string
  email?: string
  emailVerified: boolean
  groups: string[]
  createdAt?: string
  updatedAt?: string
}

export type AuthSession = {
  authMethod: AuthMethod
  accessToken: string
  idToken: string
  refreshToken: string
  accessTokenExpiresAt: number
  idTokenExpiresAt: number
  refreshTokenExpiresAt: number
  user: UserSummary
}

export type ActionResult<T = void> =
  { ok: true; data?: T } | { ok: false; message: string; details?: string[] }
