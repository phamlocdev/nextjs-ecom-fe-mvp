import 'server-only'

import { ensureFreshAccessToken } from '@/lib/auth/cognito'
import type {
  ApiErrorPayload,
  Category,
  ManagedUser,
  PaginatedResponse,
  PaginationParams,
  Product,
} from '@/lib/types'

const API_BASE_URL = process.env.BACKEND_API_URL ?? 'http://localhost:8000'

export class BackendApiError extends Error {
  status: number
  details: string[]

  constructor(status: number, message: string, details: string[] = []) {
    super(message)
    this.name = 'BackendApiError'
    this.status = status
    this.details = details
  }
}

function normalizeApiError(status: number, payload: ApiErrorPayload | null): BackendApiError {
  if (!payload) {
    return new BackendApiError(status, `Backend returned HTTP ${status}`)
  }

  const details = Array.isArray(payload.message) ? payload.message : []
  const message =
    typeof payload.message === 'string'
      ? payload.message
      : (payload.error ?? details[0] ?? `Backend returned HTTP ${status}`)

  return new BackendApiError(status, message, details)
}

async function readPayload(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined
  }

  const text = await response.text()
  if (!text) {
    return undefined
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return requestInternal<T>(path, init)
}

async function requestAsAdmin<T>(path: string, init?: RequestInit): Promise<T> {
  const session = await ensureFreshAccessToken()
  if (!session) {
    throw new BackendApiError(401, 'Your admin session has expired. Please sign in again.')
  }

  return requestInternal<T>(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      ...init?.headers,
    },
  })
}

async function requestInternal<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })
  } catch {
    throw new BackendApiError(0, `Cannot reach backend API at ${API_BASE_URL}`)
  }

  const payload = await readPayload(response)

  if (!response.ok) {
    throw normalizeApiError(response.status, payload as ApiErrorPayload | null)
  }

  return payload as T
}

export function getBackendBaseUrl(): string {
  return API_BASE_URL
}

function buildListPath(path: string, params: PaginationParams = {}): string {
  const query = new URLSearchParams()

  if (params.limit) {
    query.set('limit', String(params.limit))
  }
  if (params.cursor) {
    query.set('cursor', params.cursor)
  }
  if (params.categoryId) {
    query.set('categoryId', params.categoryId)
  }
  if (params.status) {
    query.set('status', params.status)
  }
  if (params.minPrice !== undefined) {
    query.set('minPrice', String(params.minPrice))
  }
  if (params.maxPrice !== undefined) {
    query.set('maxPrice', String(params.maxPrice))
  }
  if (params.updatedFrom) {
    query.set('updatedFrom', params.updatedFrom)
  }
  if (params.updatedTo) {
    query.set('updatedTo', params.updatedTo)
  }
  if (params.q) {
    query.set('q', params.q)
  }

  const queryString = query.toString()
  return queryString ? `${path}?${queryString}` : path
}

export async function listProducts(
  params: PaginationParams = {},
): Promise<PaginatedResponse<Product>> {
  return request<PaginatedResponse<Product>>(buildListPath('/products', params))
}

export async function listAllProducts(): Promise<Product[]> {
  const products: Product[] = []
  let cursor: string | undefined

  do {
    const page = await listProducts({ limit: 50, cursor })
    products.push(...page.items)
    cursor = page.nextCursor ?? undefined
  } while (cursor)

  return products
}

export async function getProduct(productId: string): Promise<Product> {
  return request<Product>(`/products/${encodeURIComponent(productId)}`)
}

export async function createProduct(
  payload: Omit<Product, 'productId' | 'currency' | 'createdAt' | 'updatedAt'>,
): Promise<Product> {
  return requestAsAdmin<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateProduct(
  productId: string,
  payload: Partial<Omit<Product, 'productId' | 'currency' | 'createdAt' | 'updatedAt'>>,
): Promise<Product> {
  return requestAsAdmin<Product>(`/products/${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteProduct(productId: string): Promise<void> {
  await requestAsAdmin<void>(`/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  })
}

export async function listCategories(
  params: PaginationParams = {},
): Promise<PaginatedResponse<Category>> {
  return request<PaginatedResponse<Category>>(buildListPath('/categories', params))
}

export async function listAllCategories(): Promise<Category[]> {
  const categories: Category[] = []
  let cursor: string | undefined

  do {
    const page = await listCategories({ limit: 50, cursor })
    categories.push(...page.items)
    cursor = page.nextCursor ?? undefined
  } while (cursor)

  return categories
}

export async function getCategory(categoryId: string): Promise<Category> {
  return request<Category>(`/categories/${encodeURIComponent(categoryId)}`)
}

export async function createCategory(
  payload: Pick<Category, 'categoryId' | 'name' | 'description'>,
): Promise<Category> {
  return requestAsAdmin<Category>('/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateCategory(
  categoryId: string,
  payload: Partial<Pick<Category, 'name' | 'description'>>,
): Promise<Category> {
  return requestAsAdmin<Category>(`/categories/${encodeURIComponent(categoryId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await requestAsAdmin<void>(`/categories/${encodeURIComponent(categoryId)}`, {
    method: 'DELETE',
  })
}

export async function listProductsAsAdmin(
  params: PaginationParams = {},
): Promise<PaginatedResponse<Product>> {
  return requestAsAdmin<PaginatedResponse<Product>>(buildListPath('/products', params))
}

export async function listAllProductsAsAdmin(): Promise<Product[]> {
  const products: Product[] = []
  let cursor: string | undefined

  do {
    const page = await listProductsAsAdmin({ limit: 50, cursor })
    products.push(...page.items)
    cursor = page.nextCursor ?? undefined
  } while (cursor)

  return products
}

export async function listCategoriesAsAdmin(
  params: PaginationParams = {},
): Promise<PaginatedResponse<Category>> {
  return requestAsAdmin<PaginatedResponse<Category>>(buildListPath('/categories', params))
}

export async function listAllCategoriesAsAdmin(): Promise<Category[]> {
  const categories: Category[] = []
  let cursor: string | undefined

  do {
    const page = await listCategoriesAsAdmin({ limit: 50, cursor })
    categories.push(...page.items)
    cursor = page.nextCursor ?? undefined
  } while (cursor)

  return categories
}

export async function listManagedUsersAsAdmin(): Promise<ManagedUser[]> {
  return requestAsAdmin<ManagedUser[]>('/users')
}
