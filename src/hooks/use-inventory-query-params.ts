'use client'

import { parseAsInteger, parseAsString, useQueryStates, type UseQueryStatesKeysMap } from 'nuqs'
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  type InventoryPaginationParams,
  type PageSize,
  type ProductStatus,
} from '@/lib/types'

const inventoryParsers = {
  limit: parseAsInteger.withDefault(DEFAULT_PAGE_SIZE),
  cursor: parseAsString,
  q: parseAsString,
  status: parseAsString,
} satisfies UseQueryStatesKeysMap

export function useInventoryQueryParams() {
  const [query, setQuery] = useQueryStates(inventoryParsers, {
    history: 'push',
    shallow: false,
    clearOnDefault: true,
  })

  const limit = PAGE_SIZE_OPTIONS.includes(query.limit as PageSize)
    ? (query.limit as PageSize)
    : DEFAULT_PAGE_SIZE

  const filters: Pick<InventoryPaginationParams, 'q' | 'status'> = {
    ...(query.q ? { q: query.q } : {}),
    ...(query.status === 'ACTIVE' || query.status === 'INACTIVE'
      ? { status: query.status as ProductStatus }
      : {}),
  }

  const paginationParams: InventoryPaginationParams = {
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
    setFilters: (nextFilters: Pick<InventoryPaginationParams, 'q' | 'status'>) =>
      setQuery({
        cursor: null,
        q: nextFilters.q ?? null,
        status: nextFilters.status ?? null,
      }),
  }
}
