import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  type PageSize,
  type PaginationParams,
  type ProductStatus,
} from '@/lib/types'

export type PageSearchParams = Record<string, string | string[] | undefined>

export function parsePaginationSearchParams(
  searchParams: PageSearchParams,
): Required<Pick<PaginationParams, 'limit'>> & Omit<PaginationParams, 'limit'> {
  const parsedLimit = Number(readFirst(searchParams.limit))
  const limit = isPageSize(parsedLimit) ? parsedLimit : DEFAULT_PAGE_SIZE
  const cursor = readFirst(searchParams.cursor)
  const categoryId = readNonEmpty(searchParams.categoryId)
  const status = readProductStatus(searchParams.status)
  const minPrice = readPositiveInt(searchParams.minPrice)
  const maxPrice = readPositiveInt(searchParams.maxPrice)
  const updatedFrom = readIsoDate(searchParams.updatedFrom)
  const updatedTo = readIsoDate(searchParams.updatedTo)
  const q = readNonEmpty(searchParams.q)

  return {
    limit,
    ...(cursor ? { cursor } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(status ? { status } : {}),
    ...(minPrice !== undefined ? { minPrice } : {}),
    ...(maxPrice !== undefined ? { maxPrice } : {}),
    ...(updatedFrom ? { updatedFrom } : {}),
    ...(updatedTo ? { updatedTo } : {}),
    ...(q ? { q } : {}),
  }
}

export function getPaginationHref(pathname: string, params: PaginationParams): string {
  const query = new URLSearchParams()
  query.set('limit', String(params.limit ?? DEFAULT_PAGE_SIZE))

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

  return `${pathname}?${query.toString()}`
}

export function isPageSize(value: number): value is PageSize {
  return PAGE_SIZE_OPTIONS.includes(value as PageSize)
}

function readFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function readNonEmpty(value: string | string[] | undefined): string | undefined {
  const text = readFirst(value)?.trim()
  return text ? text : undefined
}

function readProductStatus(value: string | string[] | undefined): ProductStatus | undefined {
  const status = readNonEmpty(value)
  return status === 'ACTIVE' || status === 'INACTIVE' ? status : undefined
}

function readPositiveInt(value: string | string[] | undefined): number | undefined {
  const parsed = Number(readFirst(value))
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : undefined
}

function readIsoDate(value: string | string[] | undefined): string | undefined {
  const date = readNonEmpty(value)
  return date && Number.isFinite(Date.parse(date)) ? date : undefined
}
