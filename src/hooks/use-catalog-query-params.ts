'use client'

import { parseAsInteger, parseAsString, useQueryStates, type UseQueryStatesKeysMap } from 'nuqs'
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  type PageSize,
  type PaginationParams,
  type ProductFilterParams,
  type ProductStatus,
} from '@/lib/types'

const catalogParsers = {
  limit: parseAsInteger.withDefault(DEFAULT_PAGE_SIZE),
  cursor: parseAsString,
  categoryId: parseAsString,
  status: parseAsString,
  minPrice: parseAsInteger,
  maxPrice: parseAsInteger,
  updatedFrom: parseAsString,
  updatedTo: parseAsString,
  q: parseAsString,
} satisfies UseQueryStatesKeysMap

export function useCatalogQueryParams() {
  const [query, setQuery] = useQueryStates(catalogParsers, {
    history: 'push',
    shallow: false,
    clearOnDefault: true,
  })

  const limit = PAGE_SIZE_OPTIONS.includes(query.limit as PageSize)
    ? (query.limit as PageSize)
    : DEFAULT_PAGE_SIZE

  const filters: ProductFilterParams = {
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.status === 'ACTIVE' || query.status === 'INACTIVE'
      ? { status: query.status as ProductStatus }
      : {}),
    ...(query.minPrice ? { minPrice: query.minPrice } : {}),
    ...(query.maxPrice ? { maxPrice: query.maxPrice } : {}),
    ...(query.updatedFrom ? { updatedFrom: query.updatedFrom } : {}),
    ...(query.updatedTo ? { updatedTo: query.updatedTo } : {}),
    ...(query.q ? { q: query.q } : {}),
  }

  const paginationParams: PaginationParams = {
    limit,
    ...(query.cursor ? { cursor: query.cursor } : {}),
    ...filters,
  }

  return {
    query,
    limit,
    filters,
    paginationParams,
    setLimit: (nextLimit: PageSize) => setQuery({ limit: nextLimit, cursor: null }),
    setCursor: (cursor: string | null) => setQuery({ cursor }),
    setFilters: (nextFilters: ProductFilterParams) =>
      setQuery({
        cursor: null,
        categoryId: nextFilters.categoryId ?? null,
        status: nextFilters.status ?? null,
        minPrice: nextFilters.minPrice ?? null,
        maxPrice: nextFilters.maxPrice ?? null,
        updatedFrom: nextFilters.updatedFrom ?? null,
        updatedTo: nextFilters.updatedTo ?? null,
        q: nextFilters.q ?? null,
      }),
  }
}
