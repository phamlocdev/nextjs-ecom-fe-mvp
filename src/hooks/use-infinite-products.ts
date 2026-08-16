import { useInfiniteQuery } from 'react-query'
import {
  PRODUCT_QUERY_KEYS,
  findAllProducts,
  type FindAllProductsQueryParams,
} from '@/lib/api/products'
import type { PaginatedResponse, Product } from '@/lib/types'

export function useInfiniteProductsQuery(params: Omit<FindAllProductsQueryParams, 'cursor'>) {
  return useInfiniteQuery<PaginatedResponse<Product>>(
    [...PRODUCT_QUERY_KEYS.lists(), 'infinite', params],
    ({ pageParam }) =>
      findAllProducts({
        ...params,
        ...(typeof pageParam === 'string' && pageParam ? { cursor: pageParam } : {}),
      }),
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      keepPreviousData: true,
    },
  )
}
